import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH 
  ? path.resolve(process.env.DATABASE_PATH) 
  : path.resolve(process.cwd(), 'data.db');

// Ensure parent directory exists for SQLite db creation
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
console.log('[DB] Connected to SQLite database at:', dbPath);

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
    
    // Ensure default instagram posts exist in settings
    try {
      const hasInsta = db.prepare("SELECT COUNT(*) as count FROM site_settings WHERE key = 'instagram_posts'").get() as { count: number };
      if (!hasInsta || hasInsta.count === 0) {
        const defaultPosts = [
          {
            id: "1",
            imageUrl: "/uploads/instagram-1.png",
            link: "https://www.instagram.com/p/C7X-MOTO1/",
            caption: "Le casque AGV K6 S Carbon, ultra léger et résistant. Parfait pour vos sorties sportives et roadtrips au Maroc ! 🏍️🇲🇦 #AGV #AGVK6S #MotoPaco #Rabat #Casablanca #Temara",
            likes: 248,
            comments: 19
          },
          {
            id: "2",
            imageUrl: "/uploads/instagram-2.png",
            link: "https://www.instagram.com/p/C7X-MOTO2/",
            caption: "Style et sécurité avec le blouson cuir Dainese Racing 4. Venez l'essayer dans notre showroom ! 🏍️✨ #Dainese #DaineseCrew #MotoPaco #EquipementMotard",
            likes: 194,
            comments: 12
          },
          {
            id: "3",
            imageUrl: "/uploads/instagram-3.png",
            link: "https://www.instagram.com/p/C7X-MOTO3/",
            caption: "Notre showroom est prêt pour vous accueillir avec les meilleures marques d'équipement motard au Maroc ! 🏪🏍️ #MotoPaco #SharkHelmets #Shoei #AGV #Alpinestars #Givi",
            likes: 312,
            comments: 28
          },
          {
            id: "4",
            imageUrl: "/uploads/instagram-4.png",
            link: "https://www.instagram.com/p/C7X-MOTO4/",
            caption: "Rien ne vaut une virée dans les routes de l'Atlas marocain. Équipez-vous pour l'aventure ! 🏔️🏍️ #AtlasMorocco #Roadtrip #Yamaha #Tenere #MotoPaco",
            likes: 420,
            comments: 35
          },
          {
            id: "5",
            imageUrl: "/uploads/instagram-5.png",
            link: "https://www.instagram.com/p/C7X-MOTO5/",
            caption: "Libérez la puissance et le son de votre machine avec les lignes d'échappement complètes Akrapovič. 🔊🔥 #Akrapovic #Tmax560 #AkrapovicSound #MotoPaco",
            likes: 287,
            comments: 22
          },
          {
            id: "6",
            imageUrl: "/uploads/instagram-6.png",
            link: "https://www.instagram.com/p/C7X-MOTO6/",
            caption: "Les bottes TCX RT-Race et les gants Dainese Carbon : le combo idéal pour la piste et la route. 🏁🧤 #TCXBoots #Dainese #RacingGear #MotoPaco",
            likes: 165,
            comments: 8
          }
        ];
        db.prepare("INSERT INTO site_settings (key, value) VALUES ('instagram_posts', ?)").run(JSON.stringify(defaultPosts));
        console.log('[DB] Seeded default instagram_posts settings.');
      }
    } catch (instaErr) {
      console.error('[DB] Failed to seed default instagram_posts:', instaErr);
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

// Migration: Force home limits to 15 and mark screenshot products as best sellers
try {
  // 1. Force setting limits to 15
  db.prepare("INSERT INTO site_settings (key, value) VALUES ('home_featured_limit', '15') ON CONFLICT(key) DO UPDATE SET value = excluded.value").run();
  db.prepare("INSERT INTO site_settings (key, value) VALUES ('home_new_arrivals_limit', '15') ON CONFLICT(key) DO UPDATE SET value = excluded.value").run();
  console.log('[DB] Migration: forced home_featured_limit and home_new_arrivals_limit to 15.');

  // 2. Clear previous best sellers
  db.prepare("UPDATE products SET is_bestseller = 0").run();

  // 3. Mark specific screenshot products as best sellers
  const bestsellerSlugs = [
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

  const updateStmt = db.prepare("UPDATE products SET is_bestseller = 1, sold_count = ? WHERE slug = ?");
  bestsellerSlugs.forEach((slug, idx) => {
    const soldCount = 500 - idx;
    updateStmt.run(soldCount, slug);
  });
  console.log('[DB] Migration: updated screenshot products to be best sellers.');
} catch (error: any) {
  console.error('[DB] Error running best sellers migration:', error);
}

export default db;
