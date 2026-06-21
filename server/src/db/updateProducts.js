const db = require('better-sqlite3')('data.db');

const items = [
  { slug: "casque-arai-sz", name: "Casque Arai SZ-R VAS EVO", url: "https://packmoto.com/43246-large_default/casque-arai-sz-r-vas-evo.jpg", brand: "arai", cat: "casques" },
  { slug: "visiere-hjc", name: "Visière HJC", url: "https://packmoto.com/16858-large_default/vente-visiere-hj-17r-fume-fonce-pour-hjc-fg-jet-is-33-ii.jpg", brand: "hjc", cat: "casques" },
  { slug: "antivol-auvray", name: "Antivol Auvray Chaîne", url: "https://packmoto.com/13843-large_default/antivol-auvray-chaine-x-lock-120cm-cadenas-sra.jpg", brand: "auvray", cat: "antivols" },
  { slug: "visiere-arai", name: "Visière Teintée Arai", url: "https://packmoto.com/43976-large_default/vente-visiere-teinte-pour-arai-sz-r-vas.jpg", brand: "arai", cat: "casques" },
  { slug: "bottes-difi", name: "Bottes Difi Drift", url: "https://packmoto.com/52936-large_default/bottes-moto-difi-drift.jpg", brand: "difi", cat: "bottes" },
  { slug: "bottes-macna", name: "Bottes Macna Crewser", url: "https://packmoto.com/52943-large_default/bottes-moto-macna-crewser-rtx.jpg", brand: "macna", cat: "bottes" },
  { slug: "gants-tucano", name: "Gants Tucano Urbano", url: "https://packmoto.com/52875-large_default/gants-tucano-urbano-gig-evo.jpg", brand: "tucano", cat: "gants" },
  { slug: "top-case-xplor", name: "Top Case X-Plor 45L", url: "https://packmoto.com/40724-large_default/top-case-x-plor-ks520n-45-litres.jpg", brand: "xplor", cat: "top-cases" },
  { slug: "top-case-givi", name: "Top Case Givi Outback", url: "https://packmoto.com/16067-large_default/top-case-givi-trekker-outback-58l.jpg", brand: "givi", cat: "top-cases" }
];

const getCat = db.prepare('SELECT id FROM categories WHERE slug = ?');
const getBrand = db.prepare('SELECT id FROM brands WHERE slug = ?');
const insertBrand = db.prepare('INSERT INTO brands (name, slug, is_featured) VALUES (?, ?, 1)');

const products = db.prepare('SELECT id FROM products ORDER BY created_at ASC LIMIT 9').all();

db.prepare('DELETE FROM product_images').run();

products.forEach((p, i) => {
  const item = items[i];
  
  let brand = getBrand.get(item.brand);
  if (!brand) {
    brand = { id: insertBrand.run(item.brand.toUpperCase(), item.brand).lastInsertRowid };
  }
  
  let cat = getCat.get(item.cat);
  if (!cat) cat = { id: 1 }; // fallback

  db.prepare('UPDATE products SET name = ?, slug = ?, brand_id = ?, category_id = ? WHERE id = ?').run(item.name, item.slug, brand.id, cat.id, p.id);
  db.prepare('INSERT INTO product_images (product_id, url, is_primary, sort_order) VALUES (?, ?, 1, 0)').run(p.id, item.url);
});

const ids = products.map(p => p.id);
// Temporarily disable foreign keys to delete the dummy products and their reviews/bundles
db.prepare('PRAGMA foreign_keys = OFF').run();
db.prepare(`DELETE FROM products WHERE id NOT IN (${ids.join(',')})`).run();
db.prepare('DELETE FROM reviews WHERE product_id NOT IN (' + ids.join(',') + ')').run();
db.prepare('DELETE FROM bundle_products WHERE product_id NOT IN (' + ids.join(',') + ')').run();
db.prepare('PRAGMA foreign_keys = ON').run();

console.log("Database products updated!");
