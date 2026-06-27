/**
 * syncFromWooCommerce.ts
 * Syncs products, variants, prices and stock from WooCommerce REST API → SQLite.
 * Run: npx tsx src/db/syncFromWooCommerce.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import https from 'https';
import http from 'http';

// ── Config ──────────────────────────────────────────────────────────────────
const WC_BASE = 'https://motopaco.ma/wp-json/wc/v3';
const CK = 'ck_939d8621328f64b68825f27ae18617191d82f635';
const CS = 'cs_8699e3f8826a6f2966c5c73e1cbe48650c4df210';
const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve(process.cwd(), 'data.db');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// ── HTTP helper ──────────────────────────────────────────────────────────────
function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${data.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

function wcUrl(endpoint: string, params: Record<string, string | number> = {}) {
  const p = new URLSearchParams({ consumer_key: CK, consumer_secret: CS, ...Object.fromEntries(Object.entries(params).map(([k,v]) => [k, String(v)])) });
  return `${WC_BASE}${endpoint}?${p.toString()}`;
}

// ── Slug helper ──────────────────────────────────────────────────────────────
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

// ── Prepared statements ──────────────────────────────────────────────────────
const findProductBySlug = db.prepare('SELECT id, slug FROM products WHERE slug = ?');
const findProductByName = db.prepare('SELECT id, slug FROM products WHERE name = ?');
const updateProductPrices = db.prepare(`
  UPDATE products
  SET base_price = ?, sale_price = ?, is_out_of_stock = 0, status = 'published'
  WHERE id = ?
`);
const insertProduct = db.prepare(`
  INSERT INTO products (name, slug, description, short_description, category_id, brand_id, base_price, sale_price, status, meta_title, meta_description, sold_count)
  VALUES (?, ?, ?, ?, 1, 1, ?, ?, 'published', ?, ?, ?)
`);
const deleteVariants = db.prepare('DELETE FROM product_variants WHERE product_id = ?');
const insertVariant = db.prepare(`
  INSERT OR IGNORE INTO product_variants (product_id, size, color, sku, stock, low_stock_threshold)
  VALUES (?, ?, ?, ?, ?, 3)
`);
const insertImageIfMissing = db.prepare(`
  INSERT OR IGNORE INTO product_images (product_id, url, is_primary, sort_order)
  VALUES (?, ?, ?, ?)
`);
const countImages = db.prepare('SELECT COUNT(*) as c FROM product_images WHERE product_id = ?');

// ── Main sync ────────────────────────────────────────────────────────────────
async function sync() {
  console.log('🔄 Starting WooCommerce sync...');
  console.log(`   Database: ${DB_PATH}`);

  // Fetch total count
  const firstPage = await fetchJson(wcUrl('/products', { per_page: 1, page: 1 }));
  // Get headers via a raw request to check total
  const totalPages = await getTotalPages();
  console.log(`   Total WooCommerce pages (1/page): ${totalPages} products`);

  let created = 0, updated = 0, variantsAdded = 0, errors = 0;
  const PER_PAGE = 50;
  const pages = Math.ceil(totalPages / PER_PAGE);

  for (let page = 1; page <= pages; page++) {
    console.log(`\n📦 Fetching page ${page}/${pages}...`);
    let products: any[];
    try {
      products = await fetchJson(wcUrl('/products', { per_page: PER_PAGE, page, status: 'publish' }));
    } catch (e: any) {
      console.error(`   ⚠ Failed to fetch page ${page}:`, e.message);
      errors++;
      continue;
    }

    for (const wc of products) {
      try {
        await processProduct(wc);
        if (wc.type === 'variable' && wc.variations?.length > 0) {
          const result = await syncVariations(wc);
          variantsAdded += result;
        }
      } catch (e: any) {
        console.error(`   ⚠ Error processing "${wc.name}":`, e.message);
        errors++;
      }
    }
  }

  console.log('\n✅ Sync complete!');
  console.log(`   Created: ${created} | Updated: ${updated} | Variants added: ${variantsAdded} | Errors: ${errors}`);

  // Export updated seed.sql
  console.log('\n📤 Exporting seed.sql...');
  const { execSync } = require('child_process');
  try {
    execSync(`sqlite3 "${DB_PATH}" ".dump" > src/db/seed.sql`, { cwd: process.cwd() });
    console.log('   ✅ seed.sql updated');
  } catch (e) {
    console.log('   ⚠ Could not auto-export seed.sql — run: npm run db:export');
  }

  async function processProduct(wc: any) {
    const slug = wc.slug || toSlug(wc.name);
    const basePrice = parseFloat(wc.regular_price || wc.price || '0') || 0;
    const salePrice = wc.sale_price && wc.sale_price !== '' ? parseFloat(wc.sale_price) : null;
    const stockQty = wc.stock_quantity ?? 10; // Default 10 if WC doesn't track stock

    // Try to find existing product
    let existing: any = findProductBySlug.get(slug);
    if (!existing) {
      // Try by name
      existing = findProductByName.get(wc.name);
    }

    if (existing) {
      // Update prices and stock status
      updateProductPrices.run(basePrice, salePrice, existing.id);
      // Update stock for simple products
      if (wc.type === 'simple') {
        const stock = stockQty > 0 ? stockQty : 10;
        deleteVariants.run(existing.id);
        insertVariant.run(existing.id, 'Taille Unique', 'Standard', slug + '-default', stock);
        variantsAdded++;
      }
      // Add images if none exist
      const imgCount = (countImages.get(existing.id) as any).c;
      if (imgCount === 0 && wc.images?.length > 0) {
        wc.images.forEach((img: any, i: number) => {
          insertImageIfMissing.run(existing.id, img.src, i === 0 ? 1 : 0, i);
        });
      }
      updated++;
      process.stdout.write(`   ✓ Updated: ${wc.name.slice(0, 50)}\n`);
    } else {
      // Insert new product
      const newId = (insertProduct.run(
        wc.name,
        slug,
        wc.description || '',
        wc.short_description || '',
        basePrice,
        salePrice,
        wc.name,
        wc.short_description || wc.name,
        Math.floor(Math.random() * 100) + 20
      ) as any).lastInsertRowid;

      // Insert images
      if (wc.images?.length > 0) {
        wc.images.forEach((img: any, i: number) => {
          insertImageIfMissing.run(newId, img.src, i === 0 ? 1 : 0, i);
        });
      }

      // For simple products, create a default variant
      if (wc.type === 'simple') {
        const stock = stockQty > 0 ? stockQty : 10;
        insertVariant.run(newId, 'Taille Unique', 'Standard', slug + '-default', stock);
        variantsAdded++;
      }
      created++;
      process.stdout.write(`   + Created: ${wc.name.slice(0, 50)}\n`);
    }
  }

  async function syncVariations(wc: any): Promise<number> {
    const slug = wc.slug || toSlug(wc.name);
    const existing: any = findProductBySlug.get(slug) || findProductByName.get(wc.name);
    if (!existing) return 0;

    let variations: any[];
    try {
      variations = await fetchJson(wcUrl(`/products/${wc.id}/variations`, { per_page: 100 }));
    } catch (e: any) {
      console.error(`   ⚠ Failed to fetch variations for ${wc.name}:`, e.message);
      return 0;
    }

    if (!variations || variations.length === 0) return 0;

    // Replace all existing variants
    deleteVariants.run(existing.id);

    let count = 0;
    for (const v of variations) {
      const size = v.attributes?.find((a: any) =>
        ['taille', 'size', 'pointure', 'dimension'].includes(a.name?.toLowerCase())
      )?.option || 'Taille Unique';

      const color = v.attributes?.find((a: any) =>
        ['couleur', 'color'].includes(a.name?.toLowerCase())
      )?.option || 'Standard';

      const stock = v.stock_quantity != null ? v.stock_quantity : 10;
      const sku = v.sku
        ? `${v.sku}-p${existing.id}`
        : `${slug}-${size.toLowerCase().replace(/\s+/g, '-')}-p${existing.id}`;

      insertVariant.run(existing.id, size, color, sku, stock);
      count++;
    }

    // Update base price from first variation if needed
    if (variations[0]) {
      const basePrice = parseFloat(variations[0].regular_price || variations[0].price || '0') || 0;
      const salePrices = variations.filter(v => v.sale_price && v.sale_price !== '').map(v => parseFloat(v.sale_price));
      const minSale = salePrices.length > 0 ? Math.min(...salePrices) : null;
      updateProductPrices.run(basePrice, minSale, existing.id);
    }

    process.stdout.write(`   → ${count} variants synced for: ${wc.name.slice(0, 40)}\n`);
    return count;
  }
}

async function getTotalPages(): Promise<number> {
  return new Promise((resolve) => {
    https.get(
      wcUrl('/products', { per_page: 1, page: 1 }),
      (res) => {
        const total = parseInt(res.headers['x-wp-total'] as string || '100', 10);
        res.resume();
        resolve(total);
      }
    ).on('error', () => resolve(100));
  });
}

sync().catch(console.error);
