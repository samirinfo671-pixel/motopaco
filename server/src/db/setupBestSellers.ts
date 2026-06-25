import db from './database.ts';

export const bestsellerSlugs = [
  'tcx-pulse-boots',
  'visiere-agv-k1-k1s-k3sv-k5-k5s',
  'visiere-agv-k1-s-k3sv-k5-k5s',
  'lentille-visee-casque-moto-agv-k1-k1s-k5-k5s-k3-sv-noir',
  'tcx-zeta-wp-black-red',
  'agv-k1-s-blipper-grey-red',
  'dainese-energyca-air-bottes-black-anthracite',
  'pare-carters-givi-tn2171-yamaha-tracer-9-gt-gt-plus-2025',
  'tcx-zeta-wp-black',
  'agv-k1-s-e2206-track-46',
  'chaussures-moto-dainese-dinamica',
  'dainese-dinamica-bottes-moto',
  'dainese-dinamica-bottes-moto-sportives-black-fluo',
  'lentille-visee-casque-moto-agv-k1-k1s-k5-k5s-k3-sv-dore-2',
  'lentille-visee-casque-moto-agv-k1-k1s-k5-k5s-k3-sv-dore-3',
  'tcx-infinity-3-wp-bottes-moto-impermeables-touring',
  'boitier-telepeage-givi-s604-noir',
  'bottes-moto-tcx-infinity-3-gore-tex-noir',
  'sac-arriere-etanch-givi',
  'tcx-boots-r04d-air-baskets',
  'tcx-ikasu-air-baskets-moto',
  'dainese-nighthawk-d1-gore-tex',
  'chaussures-moto-dainese-energica-d-wp-sport-noir-anthracite',
  'givi-top-case-monolock-alpina-44l',
  'givi-top-case-monolock-alpina-44l-black',
  'agv-k1s-e2206-grazie-vale',
  'tcx-r04d-wp-black-red',
  'tcx-r04d-wp-black-white'
];

export function setupBestSellers() {
  console.log('📈 Setting up best sellers and sold count metrics...');
  try {
    db.transaction(() => {
      // 1. Clear any previous best sellers
      db.prepare("UPDATE products SET is_bestseller = 0").run();
      
      // 2. Mark specific slugs as bestsellers and assign high sold counts
      const updateStmt = db.prepare("UPDATE products SET is_bestseller = 1, sold_count = ? WHERE slug = ?");
      bestsellerSlugs.forEach((slug, idx) => {
        const soldCount = 500 - idx;
        const result = updateStmt.run(soldCount, slug);
        if (result.changes > 0) {
          console.log(`  Set bestseller: ${slug} (sold_count: ${soldCount})`);
        }
      });
    })();
    console.log('✅ Best sellers and metrics setup completed!');
  } catch (error) {
    console.error('❌ Failed to setup best sellers:', error);
  }
}
