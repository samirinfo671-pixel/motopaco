import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'data.db');
const db = new Database(dbPath);

// Enable foreign key support
db.pragma('foreign_keys = ON');

// Initialize schema
try {
  const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
  } else {
    // Fallback if running from a different working directory
    const fallbackSchemaPath = path.resolve(__dirname, 'schema.sql');
    if (fs.existsSync(fallbackSchemaPath)) {
      const schema = fs.readFileSync(fallbackSchemaPath, 'utf8');
      db.exec(schema);
    } else {
      console.error('Could not locate schema.sql');
    }
  }
} catch (error) {
  console.error('Database initialization error:', error);
}

// Migration: Add sold_count to products table if not exists
try {
  db.prepare('ALTER TABLE products ADD COLUMN sold_count INTEGER DEFAULT 0').run();
  // Populate existing products with random values between 60 and 150 for social proof
  db.prepare('UPDATE products SET sold_count = ABS(RANDOM() % 91) + 60 WHERE sold_count IS NULL OR sold_count = 0').run();
  console.log('[DB] Migration: added sold_count column and populated existing products.');
} catch (error: any) {
  // Ignore if column already exists
}

// Migration: Add image_url to product_variants if not exists
try {
  db.prepare('ALTER TABLE product_variants ADD COLUMN image_url TEXT').run();
  console.log('[DB] Migration: added image_url column to product_variants.');
} catch (error: any) {
  // Ignore if column already exists
}

// Migration: Add description to product_variants if not exists
try {
  db.prepare('ALTER TABLE product_variants ADD COLUMN description TEXT').run();
  console.log('[DB] Migration: added description column to product_variants.');
} catch (error: any) {
  // Ignore if column already exists
}

// Migration: Add price_override to product_variants if not exists
try {
  db.prepare('ALTER TABLE product_variants ADD COLUMN price_override REAL').run();
  console.log('[DB] Migration: added price_override column to product_variants.');
} catch (error: any) {
  // Ignore if column already exists
}

// Migration: Create shipping_rates table if not exists
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS shipping_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT UNIQUE NOT NULL,
      cost REAL NOT NULL
    )
  `).run();
  console.log('[DB] Migration: created shipping_rates table if not exists.');
  
  // Seed shipping rates if empty
  const countObj = db.prepare('SELECT COUNT(*) as count FROM shipping_rates').get() as { count: number };
  if (countObj.count === 0) {
    const insertRate = db.prepare('INSERT INTO shipping_rates (city, cost) VALUES (?, ?)');
    const defaultRates = [
      { city: 'Casablanca', cost: 30 },
      { city: 'Mohammedia', cost: 30 },
      { city: 'Rabat', cost: 35 },
      { city: 'Salé', cost: 35 },
      { city: 'Kénitra', cost: 35 },
      { city: 'Marrakech', cost: 40 },
      { city: 'Fès', cost: 40 },
      { city: 'Tanger', cost: 40 },
      { city: 'Agadir', cost: 45 },
      { city: 'Meknès', cost: 40 },
      { city: 'Oujda', cost: 45 },
      { city: 'Tétouan', cost: 40 },
      { city: 'Nador', cost: 45 },
      { city: 'Berrechid', cost: 35 },
      { city: 'Khémisset', cost: 40 },
      { city: 'Beni Mellal', cost: 40 },
      { city: 'El Jadida', cost: 40 },
      { city: 'Safi', cost: 40 },
      { city: 'Khouribga', cost: 40 },
      { city: 'El Kelaa des Sraghna', cost: 45 },
      { city: 'Taroudant', cost: 45 },
      { city: 'Ouarzazate', cost: 50 },
      { city: 'Dakhla', cost: 60 },
      { city: 'Laâyoune', cost: 60 },
      { city: 'Al Hoceima', cost: 45 },
      { city: 'Taza', cost: 45 },
      { city: 'Berkane', cost: 45 },
      { city: 'Settat', cost: 35 },
      { city: 'Taourirt', cost: 45 },
      { city: 'Errachidia', cost: 50 }
    ];
    for (const rate of defaultRates) {
      insertRate.run(rate.city, rate.cost);
    }
    console.log('[DB] Seeding default shipping rates complete.');
  }
} catch (error) {
  console.error('[DB] Error migrating/seeding shipping rates:', error);
}

// Seed or update default whatsapp number in site_settings
try {
  const rowCount = db.prepare('SELECT COUNT(*) as count FROM site_settings').get() as { count: number };
  if (rowCount.count === 0) {
    const insertSetting = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)');
    insertSetting.run('whatsapp_number', '212667389916');
    insertSetting.run('seo_title', 'MOTO PACO | Équipement Motard Maroc & Accessoires Moto');
    insertSetting.run('seo_description', 'MOTO PACO : Le spécialiste d\'équipement motard original au Maroc. Casques, gants, vestes et accessoires Givi, Alpinestars, AGV, TCX, Akrapovič aux meilleurs prix.');
    insertSetting.run('contact_email', 'contact@packmoto.ma');
    insertSetting.run('store_address', 'Lotissement assaada n92, Ain atiq 12000');
    console.log('[DB] Seeded default site settings.');
  } else {
    // Force set the whatsapp number to the newly requested +212667389916
    db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('whatsapp_number', '212667389916');
    console.log('[DB] Updated whatsapp_number to +212667389916 in database settings.');

    // Migrate existing SEO titles/descriptions if they are the old defaults
    try {
      db.prepare(`
        UPDATE site_settings 
        SET value = 'MOTO PACO | Équipement Motard Maroc & Accessoires Moto' 
        WHERE key = 'seo_title' AND value = 'MOTO PACO - Équipement & Accessoires Moto'
      `).run();
      db.prepare(`
        UPDATE site_settings 
        SET value = 'MOTO PACO : Le spécialiste d''équipement motard original au Maroc. Casques, gants, vestes et accessoires Givi, Alpinestars, AGV, TCX, Akrapovič aux meilleurs prix.' 
        WHERE key = 'seo_description' AND (value LIKE '%Votre boutique%pour l%' OR value = 'Votre boutique n°1 au Maroc pour l''équipement motard.')
      `).run();
      console.log('[DB] Migrated existing site settings SEO defaults.');
    } catch (e) {
      console.error('[DB] SEO settings migration failed:', e);
    }
  }
} catch (error) {
  console.error('[DB] Error seeding site settings:', error);
}

// Migration: Add is_featured and is_bestseller to products table
try {
  db.prepare('ALTER TABLE products ADD COLUMN is_featured INTEGER DEFAULT 0').run();
  console.log('[DB] Migration: added is_featured column to products.');
} catch (error: any) {
  // Ignore if column already exists
}

try {
  db.prepare('ALTER TABLE products ADD COLUMN is_bestseller INTEGER DEFAULT 0').run();
  console.log('[DB] Migration: added is_bestseller column to products.');
} catch (error: any) {
  // Ignore if column already exists
}

try {
  db.prepare('ALTER TABLE products ADD COLUMN is_promo_featured INTEGER DEFAULT 0').run();
  console.log('[DB] Migration: added is_promo_featured column to products.');
} catch (error: any) {
  // Ignore if column already exists
}

try {
  db.prepare('ALTER TABLE products ADD COLUMN is_out_of_stock INTEGER DEFAULT 0').run();
  console.log('[DB] Migration: added is_out_of_stock column to products.');
} catch (error: any) {
  // Ignore if column already exists
}

export default db;
