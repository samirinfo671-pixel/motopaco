import db from './database.ts';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const getSetting = (key: string) => {
  try {
    const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : null;
  } catch {
    return null;
  }
};

const wooUrl = getSetting('woocommerce_url') || process.env.WOOCOMMERCE_URL || '';
const wooCk = getSetting('woocommerce_ck') || process.env.WOOCOMMERCE_CK || '';
const wooCs = getSetting('woocommerce_cs') || process.env.WOOCOMMERCE_CS || '';

if (!wooUrl || !wooCk || !wooCs) {
  console.error("Credentials not configured.");
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${wooCk}:${wooCs}`).toString('base64');

async function apiFetch(endpoint: string) {
  const url = `${wooUrl}${endpoint}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`[API Error] GET ${endpoint} returned status ${response.status}`);
  }
  return response.json();
}

async function repair() {
  console.log("Starting price repair script...");
  
  // Find all products with 0 price
  const zeroProducts = db.prepare('SELECT id, name, slug FROM products WHERE base_price <= 0').all() as any[];
  console.log(`Found ${zeroProducts.length} products with base_price <= 0`);
  
  for (const p of zeroProducts) {
    console.log(`Repairing product: ${p.name} (ID: ${p.id})`);
    
    try {
      // Fetch WooCommerce product by slug (searching for it)
      const wcProducts = await apiFetch(`/wp-json/wc/v3/products?slug=${p.slug}`);
      if (wcProducts.length === 0) {
        console.log(`  No product found in WooCommerce for slug: ${p.slug}`);
        continue;
      }
      
      const wcP = wcProducts[0];
      console.log(`  WooCommerce Product type: ${wcP.type}, price: ${wcP.price}, reg: ${wcP.regular_price}`);
      
      if (wcP.type === 'variable') {
        const variations = await apiFetch(`/wp-json/wc/v3/products/${wcP.id}/variations`);
        console.log(`  Found ${variations.length} variations`);
        
        let minPrice = Infinity;
        let minSalePrice = null;
        
        for (const v of variations) {
          const vRegPrice = parseFloat(v.regular_price) || 0;
          const vSalePrice = v.sale_price && v.sale_price !== "" ? parseFloat(v.sale_price) : null;
          const vPrice = parseFloat(v.price) || vRegPrice || 0;
          
          if (vPrice > 0 && vPrice < minPrice) {
            minPrice = vPrice;
            minSalePrice = vSalePrice;
          }
          
          // Update variant in database
          const vSku = v.sku || `${p.slug}-${v.id}`;
          // Check if variant exists
          const existingVar = db.prepare('SELECT id FROM product_variants WHERE sku = ?').get(vSku);
          if (existingVar) {
            db.prepare('UPDATE product_variants SET price_override = ? WHERE sku = ?').run(
              vPrice > 0 ? vPrice : null,
              vSku
            );
            console.log(`    Updated variant ${vSku} with price ${vPrice}`);
          } else {
            // Insert it
            db.prepare(`
              INSERT INTO product_variants (product_id, size, color, sku, stock, image_url, description, price_override)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              p.id,
              v.attributes?.find((a: any) => a.name.toLowerCase() === 'taille' || a.name.toLowerCase() === 'size')?.option || 'Standard',
              v.attributes?.find((a: any) => a.name.toLowerCase() === 'couleur' || a.name.toLowerCase() === 'color')?.option || 'Standard',
              vSku,
              v.manage_stock ? (v.stock_quantity || 0) : 10,
              v.image?.src || null,
              v.description || null,
              vPrice > 0 ? vPrice : null
            );
            console.log(`    Inserted variant ${vSku} with price ${vPrice}`);
          }
        }
        
        if (minPrice !== Infinity) {
          db.prepare('UPDATE products SET base_price = ?, sale_price = ? WHERE id = ?').run(
            minPrice,
            minSalePrice,
            p.id
          );
          console.log(`  Updated parent product base_price to ${minPrice}, sale_price to ${minSalePrice}`);
        }
      } else {
        // Simple product
        const regPrice = parseFloat(wcP.regular_price) || parseFloat(wcP.price) || 0;
        const salePrice = wcP.sale_price && wcP.sale_price !== "" ? parseFloat(wcP.sale_price) : null;
        if (regPrice > 0) {
          db.prepare('UPDATE products SET base_price = ?, sale_price = ? WHERE id = ?').run(
            regPrice,
            salePrice,
            p.id
          );
          console.log(`  Updated simple product base_price to ${regPrice}, sale_price to ${salePrice}`);
        }
      }
    } catch (err: any) {
      console.error(`  Error repairing ${p.name}:`, err.message);
    }
  }
  console.log("Repair finished.");
}

repair();
