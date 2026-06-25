import db from './database.ts';

export function cleanupDemoData() {
  try {
    const cleanRow = db.prepare("SELECT value FROM site_settings WHERE key = 'demo_data_cleaned'").get() as { value: string } | undefined;
    if (cleanRow && cleanRow.value === 'true') {
      console.log('✨ Demo data already cleaned up. Skipping cleanup.');
      return;
    }
  } catch (e) {
    // If settings table doesn't exist yet, proceed with cleanup
  }

  console.log('🧹 Starting database cleanup: Removing old demo products and empty categories...');
  
  try {
    db.transaction(() => {
      // 1. Dissociate any order items referencing the demo products to prevent FK errors.
      // Order items preserve historical names and prices in text columns (product_name, variant_label),
      // so nullifying the IDs is safe and standard e-commerce practice.
      const nullifyOrderItemsStmt = db.prepare(`
        UPDATE order_items 
        SET product_id = NULL, variant_id = NULL 
        WHERE product_id IN (
          SELECT id FROM products 
          WHERE slug LIKE '%-maroc' 
             OR slug IN ('casque-arai-sz', 'visiere-hjc', 'antivol-auvray', 'visiere-arai', 'bottes-difi', 'bottes-macna', 'gants-tucano', 'top-case-xplor', 'top-case-givi')
        )
      `);
      const resultNullified = nullifyOrderItemsStmt.run();
      console.log(`✅ Dissociated ${resultNullified.changes} order items from old demo products.`);

      // 2. Delete the old demo products
      const deleteProductsStmt = db.prepare(`
        DELETE FROM products 
        WHERE slug LIKE '%-maroc' 
           OR slug IN ('casque-arai-sz', 'visiere-hjc', 'antivol-auvray', 'visiere-arai', 'bottes-difi', 'bottes-macna', 'gants-tucano', 'top-case-xplor', 'top-case-givi')
      `);
      
      const resultProds = deleteProductsStmt.run();
      console.log(`✅ Deleted ${resultProds.changes} old demo products (and cascade-deleted their variants/images).`);

      // 3. Delete the old empty subcategories that were created during seed
      // IDs: 4 (Casques), 5 (Gants), 6 (Vestes), 7 (Bottes), 8 (Pantalons), 9 (Échappements), 10 (Kit Chaîne), 
      // 11 (Bagagerie), 12 (Protections), 13 (Sacoches), 14 (Lunettes), 15 (Accessoires USB)
      const deleteCategoriesStmt = db.prepare(`
        DELETE FROM categories 
        WHERE id IN (4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15)
      `);
      const resultCats = deleteCategoriesStmt.run();
      console.log(`✅ Deleted ${resultCats.changes} old empty subcategories.`);

      // Delete parent category 3 (Moto & Quad) as it is not used by WooCommerce products
      const deleteParentCatStmt = db.prepare(`
        DELETE FROM categories 
        WHERE id = 3
      `);
      const resultParentCat = deleteParentCatStmt.run();
      console.log(`✅ Deleted old unused parent category "Moto & Quad" (${resultParentCat.changes} row).`);

      // 4. Delete any brands that have no products associated with them
      const deleteBrandsStmt = db.prepare(`
        DELETE FROM brands 
        WHERE id NOT IN (SELECT DISTINCT brand_id FROM products WHERE brand_id IS NOT NULL)
      `);
      const resultBrands = deleteBrandsStmt.run();
      console.log(`✅ Cleaned up ${resultBrands.changes} unused brands.`);

      // Mark as cleaned in site_settings so it never runs again
      db.prepare(`
        INSERT INTO site_settings (key, value) 
        VALUES ('demo_data_cleaned', 'true') 
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run();
    })();
    
    console.log('🎉 Database cleanup successfully completed!');
  } catch (error) {
    console.error('❌ Failed to run database cleanup:', error);
  }
}

// Run directly if executed via CLI
if (process.argv[1] && (process.argv[1].endsWith('cleanupDemoData.ts') || process.argv[1].endsWith('cleanupDemoData'))) {
  cleanupDemoData();
  process.exit(0);
}
