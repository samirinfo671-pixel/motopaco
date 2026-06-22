import db from './database.ts';
import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export async function runWooCommerceImport(
  onProgress?: (data: { step: string; progress: number; log?: string }) => void
): Promise<{ importedCount: number }> {
  // Helper to fetch keys from site_settings or fallback to env variables
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

  if (!wooUrl || wooUrl.includes('your-woocommerce-site.com') || !wooCk || !wooCs) {
    throw new Error("L'URL WooCommerce ou les clés d'API ne sont pas configurées. Veuillez les renseigner dans les réglages.");
  }

  const authHeader = 'Basic ' + Buffer.from(`${wooCk}:${wooCs}`).toString('base64');

  async function apiFetch(endpoint: string, params: Record<string, string | number> = {}) {
    const url = new URL(`${wooUrl}${endpoint}`);
    Object.entries(params).forEach(([key, val]) => url.searchParams.append(key, String(val)));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`[API Error] GET ${endpoint} returned status ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  onProgress?.({ step: 'Connexion à WooCommerce...', progress: 5, log: `Connexion à : ${wooUrl}` });

  // 1. Fetch Categories
  onProgress?.({ step: 'Chargement des catégories...', progress: 10, log: 'Téléchargement des catégories WooCommerce...' });
  let page = 1;
  let wooCategories: any[] = [];
  while (true) {
    onProgress?.({ step: 'Chargement des catégories...', progress: 10, log: `Téléchargement des catégories (Page ${page})...` });
    const cats = await apiFetch('/wp-json/wc/v3/products/categories', { page, per_page: 100 });
    if (!cats || cats.length === 0) break;
    wooCategories = wooCategories.concat(cats);
    page++;
  }
  onProgress?.({ step: 'Catégories chargées', progress: 15, log: `${wooCategories.length} catégories trouvées.` });

  // 2. Insert Categories into Database
  onProgress?.({ step: 'Synchronisation des catégories...', progress: 20, log: 'Enregistrement des catégories en base de données...' });
  const catMap: Record<number, number> = {}; // WooCommerce ID -> SQLite ID
  
  // Sort so parent categories are created first
  wooCategories.sort((a, b) => a.parent - b.parent);

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, parent_id, image_url, meta_title, meta_description, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(slug) DO UPDATE SET name=excluded.name, image_url=excluded.image_url
  `);

  db.transaction(() => {
    for (const cat of wooCategories) {
      const parentId = cat.parent ? (catMap[cat.parent] || null) : null;
      insertCategory.run(
        cat.name,
        cat.slug,
        parentId,
        cat.image?.src || null,
        cat.name,
        (cat.description || '').replace(/<[^>]*>/g, '').trim() || `Achetez nos articles de catégorie ${cat.name} au meilleur prix.`
      );
      
      // Find ID in local SQLite db
      const row = db.prepare('SELECT id FROM categories WHERE slug = ?').get(cat.slug) as { id: number };
      catMap[cat.id] = row.id;
    }
  })();
  onProgress?.({ step: 'Catégories synchronisées', progress: 30, log: 'Toutes les catégories ont été importées.' });

  // 3. Fetch Products
  onProgress?.({ step: 'Chargement des produits...', progress: 40, log: 'Téléchargement des produits WooCommerce...' });
  page = 1;
  let wooProducts: any[] = [];
  while (true) {
    onProgress?.({ step: 'Chargement des produits...', progress: 40, log: `Téléchargement des produits (Page ${page})...` });
    const prods = await apiFetch('/wp-json/wc/v3/products', { page, per_page: 50 });
    if (!prods || prods.length === 0) break;
    wooProducts = wooProducts.concat(prods);
    page++;
  }
  onProgress?.({ step: 'Produits chargés', progress: 45, log: `${wooProducts.length} produits trouvés.` });

  // 4. Sync Products & Variations
  const insertBrand = db.prepare(`
    INSERT INTO brands (name, slug, is_featured)
    VALUES (?, ?, 0)
    ON CONFLICT(slug) DO NOTHING
  `);

  const insertProduct = db.prepare(`
    INSERT INTO products (name, slug, description, short_description, category_id, brand_id, base_price, sale_price, status, meta_title, meta_description, sold_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET 
      name=excluded.name, description=excluded.description, short_description=excluded.short_description,
      base_price=excluded.base_price, sale_price=excluded.sale_price, status=excluded.status
  `);

  const insertImage = db.prepare(`
    INSERT INTO product_images (product_id, url, is_primary, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (product_id, size, color, sku, stock, image_url, description, price_override)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(sku) DO UPDATE SET stock=excluded.stock, image_url=excluded.image_url, description=excluded.description, price_override=excluded.price_override
  `);

  let importedCount = 0;

  for (const p of wooProducts) {
    const currentProgress = 50 + Math.floor((importedCount / wooProducts.length) * 45);
    onProgress?.({
      step: `Importation : ${p.name}`,
      progress: currentProgress,
      log: `Importation de "${p.name}" (${importedCount + 1}/${wooProducts.length})...`
    });

    const nameLower = p.name.toLowerCase();

    // Determine brand from attributes (like "Marque" or "Brand") or fallback to MOTO PACO
    let brandName = 'MOTO PACO';
    const brandAttr = p.attributes?.find((a: any) => a.name.toLowerCase() === 'marque' || a.name.toLowerCase() === 'brand');
    if (brandAttr && brandAttr.options && brandAttr.options.length > 0) {
      brandName = brandAttr.options[0];
    } else {
      // Fallback brand match based on name keywords
      const knownBrands = [
        { key: 'dainese', name: 'DAINESE' },
        { key: 'alpinestars', name: 'ALPINESTARS' },
        { key: 'agv', name: 'AGV' },
        { key: 'givi', name: 'GIVI' },
        { key: 'tcx', name: 'TCX' },
        { key: 'nolan', name: 'NOLAN' },
        { key: 'shark', name: 'SHARK' },
        { key: 'shoei', name: 'SHOEI' },
        { key: 'arai', name: 'ARAI' },
        { key: 'hjc', name: 'HJC' },
        { key: 'fox', name: 'FOX RACING' },
        { key: 'akrapovic', name: 'AKRAPOVIC' },
        { key: 'kenny', name: 'KENNY' },
        { key: 'did', name: 'DID' },
        { key: 'odi', name: 'ODI' },
        { key: '100%', name: '100%' },
        { key: 'revit', name: 'REV\'IT' },
        { key: 'rev\'it', name: 'REV\'IT' },
        { key: 'spidi', name: 'SPIDI' }
      ];
      for (const b of knownBrands) {
        if (nameLower.includes(b.key)) {
          brandName = b.name;
          break;
        }
      }
    }
    const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');
    
    insertBrand.run(brandName, brandSlug);
    const brandRow = db.prepare('SELECT id FROM brands WHERE slug = ?').get(brandSlug) as { id: number };
    const brandId = brandRow.id;

    // Match category ID
    let categoryId: number | null = null;
    if (p.categories && p.categories.length > 0) {
      const firstCatId = p.categories[0].id;
      categoryId = catMap[firstCatId] || null;
    }

    // Keyword fallback classification for clean organization
    if (!categoryId || [1, 2, 16, 31].includes(categoryId)) {
      let targetSlug = null;
      if (nameLower.includes('casque') || nameLower.includes('helmet') || nameLower.includes('visiere') || nameLower.includes('visière') || nameLower.includes('nolan') || nameLower.includes('shoei') || nameLower.includes('arai') || nameLower.includes('hjc')) {
        targetSlug = 'casques-moto';
      } else if (nameLower.includes('gant')) {
        targetSlug = 'gants-moto';
      } else if (nameLower.includes('botte') || nameLower.includes('chaussure') || nameLower.includes('basket')) {
        targetSlug = 'bottes-moto';
      } else if (nameLower.includes('veste') || nameLower.includes('blouson') || nameLower.includes('jacket') || nameLower.includes('gilet')) {
        targetSlug = 'jackets';
      } else if (nameLower.includes('sac') || nameLower.includes('valise') || nameLower.includes('top-case') || nameLower.includes('top case') || nameLower.includes('bag') || nameLower.includes('bagagerie') || nameLower.includes('backpack')) {
        targetSlug = 'bagagerie-moto';
      } else if (nameLower.includes('pneu') || nameLower.includes('tire')) {
        targetSlug = 'pneus';
      } else if (nameLower.includes('crash bar') || nameLower.includes('crashbar')) {
        targetSlug = 'crash-bars';
      } else if (nameLower.includes('support')) {
        targetSlug = 'support-pour-telephone-portable';
      }
      
      if (targetSlug) {
        const catRow = db.prepare('SELECT id FROM categories WHERE slug = ?').get(targetSlug) as { id: number } | undefined;
        if (catRow) {
          categoryId = catRow.id;
        }
      }
    }

    // Base & Sale prices
    const basePrice = parseFloat(p.regular_price) || parseFloat(p.price) || 0;
    let salePrice = p.sale_price && p.sale_price !== "" ? parseFloat(p.sale_price) : null;
    if (salePrice !== null && salePrice >= basePrice) {
      salePrice = null;
    }

    // Status
    const status = p.status === 'publish' ? 'published' : 'draft';

    // Insert product
    insertProduct.run(
      p.name,
      p.slug,
      p.description || '',
      p.short_description || '',
      categoryId,
      brandId,
      basePrice,
      salePrice,
      status,
      p.name,
      p.short_description || `${p.name} au Maroc. Achetez au meilleur prix chez MOTO PACO.`,
      Math.floor(Math.random() * 91) + 60 // Social proof count
    );

    const prodRow = db.prepare('SELECT id FROM products WHERE slug = ?').get(p.slug) as { id: number };
    const productId = prodRow.id;

    // Delete existing images to rebuild
    db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId);

    // Insert Images
    if (p.images && p.images.length > 0) {
      p.images.forEach((img: any, idx: number) => {
        insertImage.run(productId, img.src, idx === 0 ? 1 : 0, idx);
      });
    } else {
      // Fallback placeholder image
      insertImage.run(productId, 'https://picsum.photos/seed/default/600/600', 1, 0);
    }

    // Handle variants
    if (p.type === 'variable' && p.variations && p.variations.length > 0) {
      try {
        const variations = await apiFetch(`/wp-json/wc/v3/products/${p.id}/variations`);
        
        let minPrice = Infinity;
        let minSalePrice = null;
        
        for (const v of variations) {
          // Find size and color attributes
          let size = 'Standard';
          let color = 'Standard';
          
          const sizeAttr = v.attributes?.find((a: any) => a.name.toLowerCase() === 'taille' || a.name.toLowerCase() === 'size');
          if (sizeAttr) size = sizeAttr.option;
          
          const colorAttr = v.attributes?.find((a: any) => a.name.toLowerCase() === 'couleur' || a.name.toLowerCase() === 'color');
          if (colorAttr) color = colorAttr.option;

          const vSku = v.sku || `${p.slug}-${v.id}`;
          const vStock = v.manage_stock ? (v.stock_quantity || 0) : 10;
          const vImg = v.image?.src || null;
          const vDesc = v.description || null;
          
          const vRegPrice = parseFloat(v.regular_price) || 0;
          const vSalePrice = v.sale_price && v.sale_price !== "" ? parseFloat(v.sale_price) : null;
          const vPrice = parseFloat(v.price) || vRegPrice || 0;
          
          if (vPrice > 0 && vPrice < minPrice) {
            minPrice = vPrice;
            minSalePrice = vSalePrice;
          }

          insertVariant.run(
            productId,
            size,
            color,
            vSku,
            vStock,
            vImg,
            vDesc,
            vPrice > 0 ? vPrice : null
          );
        }
        
        if (minPrice !== Infinity && (basePrice === 0 || basePrice === null)) {
          db.prepare('UPDATE products SET base_price = ?, sale_price = ? WHERE id = ?').run(
            minPrice,
            minSalePrice,
            productId
          );
        }
      } catch (varErr: any) {
        onProgress?.({
          step: `Importation : ${p.name}`,
          progress: currentProgress,
          log: `⚠️ Erreur de variations pour ${p.name}: ${varErr.message}`
        });
      }
    } else {
      // Simple product: single variant
      const sku = p.sku || `${p.slug}-default`;
      const stock = p.manage_stock ? (p.stock_quantity || 0) : 15;
      const imgUrl = p.images && p.images.length > 0 ? p.images[0].src : null;
      const simplePrice = parseFloat(p.price) || null;

      insertVariant.run(
        productId,
        'Taille Unique',
        'Standard',
        sku,
        stock,
        imgUrl,
        null,        // description
        simplePrice  // price_override
      );
    }

    importedCount++;
  }

  onProgress?.({
    step: 'Importation terminée !',
    progress: 100,
    log: `Importation complétée. ${importedCount} produits synchronisés.`
  });

  return { importedCount };
}

// Preserve CLI capability when run directly using npx tsx
if (process.argv[1] && (process.argv[1].endsWith('importWooCommerce.ts') || process.argv[1].endsWith('importWooCommerce'))) {
  console.log('🏁 Starting WooCommerce Import from CLI...');
  runWooCommerceImport((data) => {
    console.log(`[${data.progress}%] ${data.step}`);
    if (data.log) {
      console.log(`   👉 ${data.log}`);
    }
  })
    .then((res) => {
      console.log(`\n🎉 Success! Synced ${res.importedCount} products.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Fatal CLI error:', err);
      process.exit(1);
    });
}
