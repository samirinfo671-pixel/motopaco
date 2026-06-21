import db from './database.ts';

const brandsList = [
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

export function organizeCatalog() {
  console.log('🧹 Starting Database Catalog Reorganization (Categories & Brands)...');
  
  try {
    db.transaction(() => {
      // 1. Fetch all products
      const products = db.prepare('SELECT id, name FROM products').all() as { id: number, name: string }[];
      
      let brandUpdates = 0;
      let catUpdates = 0;
      
      for (const p of products) {
        const nameLower = p.name.toLowerCase();
        
        // Determine Brand
        let targetBrand = 'MOTO PACO';
        for (const b of brandsList) {
          if (nameLower.includes(b.key)) {
            targetBrand = b.name;
            break;
          }
        }
        
        const brandSlug = targetBrand.toLowerCase().replace(/\s+/g, '-');
        // Ensure brand exists in database
        db.prepare('INSERT OR IGNORE INTO brands (name, slug) VALUES (?, ?)').run(targetBrand, brandSlug);
        const brandRow = db.prepare('SELECT id FROM brands WHERE slug = ?').get(brandSlug) as { id: number };
        
        // Update brand_id
        db.prepare('UPDATE products SET brand_id = ? WHERE id = ?').run(brandRow.id, p.id);
        brandUpdates++;
        
        // Determine Category fallback if currently generic (like Équipement du pilote (1), Pièces & Accessoires (2), Accessoire (16), NOUVEAUTÉS PROMOTION (31))
        const currentProd = db.prepare('SELECT category_id FROM products WHERE id = ?').get(p.id) as { category_id: number | null };
        const currentCatId = currentProd?.category_id;
        
        if (!currentCatId || [1, 2, 16, 31].includes(currentCatId)) {
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
              db.prepare('UPDATE products SET category_id = ? WHERE id = ?').run(catRow.id, p.id);
              catUpdates++;
            }
          }
        }
      }
      
      console.log(`✅ Brand Reorganization Complete. Updated ${brandUpdates} brands.`);
      console.log(`✅ Category Reorganization Complete. Updated ${catUpdates} category classifications.`);
    })();
  } catch (err: any) {
    console.error('❌ Failed to reorganize catalog:', err.message);
  }
}

// Run directly if executed via CLI
if (process.argv[1] && (process.argv[1].endsWith('organizeCatalog.ts') || process.argv[1].endsWith('organizeCatalog'))) {
  organizeCatalog();
  process.exit(0);
}
