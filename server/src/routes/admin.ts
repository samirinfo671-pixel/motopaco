import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../db/database.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';
import { adminOnly } from '../middleware/adminOnly.ts';
import { slugify } from '../utils/slugify.ts';
import { runWooCommerceImport } from '../db/importWooCommerce.ts';
import { proxyImageUrl } from '../utils/imageProxy.ts';

const router = Router();

// Configure multer storage for image uploads
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Apply authentication and admin checking to ALL admin endpoints
router.use(authMiddleware);
router.use(adminOnly);

// GET /api/admin/dashboard (KPI and chart statistics)
router.get('/dashboard', (req: Request, res: Response) => {
  try {
    // 1. KPI cards
    const revenueRow = db.prepare("SELECT SUM(total) as revenue FROM orders WHERE status != 'cancelled'").get() as { revenue: number | null };
    const pendingCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get() as { count: number };
    const clientsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get() as { count: number };
    
    // Low stock count (variants where stock <= low_stock_threshold)
    const lowStockCount = db.prepare("SELECT COUNT(distinct product_id) as count FROM product_variants WHERE stock <= low_stock_threshold").get() as { count: number };

    // 2. Sales last 30 days (Recharts format)
    const salesHistory = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as orders, SUM(total) as amount
      FROM orders
      WHERE status != 'cancelled' AND created_at >= date('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `).all() as any[];

    // 2.5 Sales by Source
    const salesBySource = db.prepare(`
      SELECT source, SUM(total) as revenue, COUNT(*) as orders
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY source
      ORDER BY revenue DESC
    `).all() as any[];

    // 3. Top 5 sold products
    const topProducts = db.prepare(`
      SELECT p.id, p.name, SUM(oi.quantity) as sold_count, SUM(oi.line_total) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY sold_count DESC
      LIMIT 5
    `).all() as any[];

    // 4. Dernières commandes table
    const recentOrders = db.prepare(`
      SELECT * FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `).all() as any[];

    res.json({
      kpis: {
        revenue: revenueRow.revenue || 0,
        pending_orders: pendingCount.count,
        active_clients: clientsCount.count,
        low_stock_products: lowStockCount.count
      },
      sales_history: salesHistory,
      sales_by_source: salesBySource,
      top_products: topProducts,
      recent_orders: recentOrders
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/products (List all products for management)
router.get('/products', (req: Request, res: Response) => {
  try {
    const products = db.prepare(`
      SELECT p.*, b.name as brand_name, c.name as category_name,
        (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id) as total_stock
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `).all() as any[];

    const enhanced = products.map(p => {
      const primaryImage = db.prepare('SELECT url FROM product_images WHERE product_id = ? AND is_primary = 1').get(p.id) as { url: string } | undefined;
      const images = db.prepare('SELECT id, url, is_primary FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC').all(p.id) as any[];
      const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(p.id) as any[];
      return {
        ...p,
        primary_image: proxyImageUrl(primaryImage ? primaryImage.url : 'https://picsum.photos/seed/default/600/600'),
        images: images.map(img => ({ ...img, url: proxyImageUrl(img.url) })),
        variants: variants.map(v => ({ ...v, image_url: proxyImageUrl(v.image_url) }))
      };
    });

    res.json(enhanced);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/products (Add product)
router.post('/products', (req: Request, res: Response) => {
  const {
    name,
    description,
    short_description,
    category_id,
    brand_id,
    base_price,
    sale_price,
    status = 'published',
    meta_title,
    meta_description,
    sold_count = 0,
    is_featured = 0,
    is_bestseller = 0,
    is_promo_featured = 0,
    is_out_of_stock = 0,
    variants = [] // Array of { size, color, sku, stock }
  } = req.body;

  if (!name || !base_price) {
    return res.status(400).json({ message: 'Nom et prix de base requis.' });
  }

  try {
    const slug = slugify(name) + '-' + Math.floor(Math.random() * 1000);
    const mTitle = meta_title || `${name} Maroc | MOTO PACO`;
    const mDescription = meta_description || `${short_description || name}. Achetez au meilleur prix au Maroc chez MOTO PACO.`;

    const createProduct = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO products (name, slug, description, short_description, category_id, brand_id, base_price, sale_price, status, meta_title, meta_description, sold_count, is_featured, is_bestseller, is_promo_featured, is_out_of_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, slug, description || '', short_description || '', category_id || null, brand_id || null, parseFloat(base_price), sale_price ? parseFloat(sale_price) : null, status, mTitle, mDescription, parseInt(sold_count as string, 10) || 0, is_featured ? 1 : 0, is_bestseller ? 1 : 0, is_promo_featured ? 1 : 0, is_out_of_stock ? 1 : 0);

      const productId = result.lastInsertRowid as number;

      // Add default product image if none uploaded yet
      db.prepare(`
        INSERT INTO product_images (product_id, url, is_primary, sort_order)
        VALUES (?, ?, 1, 0)
      `).run(productId, `https://picsum.photos/seed/${slug}/600/600`);

      // Add variants
      const insertVariant = db.prepare(`
        INSERT INTO product_variants (product_id, size, color, sku, stock, low_stock_threshold, image_url, description, price_override)
        VALUES (?, ?, ?, ?, ?, 3, ?, ?, ?)
      `);

      if (variants.length > 0) {
        variants.forEach((v: any) => {
          const sku = v.sku || `${slugify(name).substring(0, 5).toUpperCase()}-${v.size || 'UNI'}-${Math.floor(Math.random() * 1000)}`;
          insertVariant.run(productId, v.size || null, v.color || null, sku, parseInt(v.stock, 10) || 0, v.image_url || null, v.description || null, v.price_override ? parseFloat(v.price_override) : null);
        });
      } else {
        // Create one default variant
        const sku = `MP-${slugify(name).substring(0, 5).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
        insertVariant.run(productId, 'Taille Unique', 'Standard', sku, 10, null, null, null);
      }

      return productId;
    });

    const productId = createProduct();
    res.status(201).json({ message: 'Produit créé avec succès.', id: productId });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/products/:id (Edit product)
router.put('/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    description,
    short_description,
    category_id,
    brand_id,
    base_price,
    sale_price,
    status,
    meta_title,
    meta_description,
    sold_count = 0,
    is_featured = 0,
    is_bestseller = 0,
    is_promo_featured = 0,
    is_out_of_stock = 0,
    variants = []
  } = req.body;

  try {
    const editProduct = db.transaction(() => {
      db.prepare(`
        UPDATE products
        SET name = ?, description = ?, short_description = ?, category_id = ?, brand_id = ?, base_price = ?, sale_price = ?, status = ?, meta_title = ?, meta_description = ?, sold_count = ?, is_featured = ?, is_bestseller = ?, is_promo_featured = ?, is_out_of_stock = ?
        WHERE id = ?
      `).run(name, description, short_description, category_id || null, brand_id || null, parseFloat(base_price), sale_price ? parseFloat(sale_price) : null, status, meta_title, meta_description, parseInt(sold_count as string, 10) || 0, is_featured ? 1 : 0, is_bestseller ? 1 : 0, is_promo_featured ? 1 : 0, is_out_of_stock ? 1 : 0, id);

      // Re-manage variants
      if (variants.length > 0) {
        // Clean current variants
        db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(id);

        const insertVariant = db.prepare(`
          INSERT INTO product_variants (product_id, size, color, sku, stock, low_stock_threshold, image_url, description, price_override)
          VALUES (?, ?, ?, ?, ?, 3, ?, ?, ?)
        `);

        variants.forEach((v: any) => {
          insertVariant.run(id, v.size || null, v.color || null, v.sku, parseInt(v.stock, 10) || 0, v.image_url || null, v.description || null, v.price_override ? parseFloat(v.price_override) : null);
        });
      }
    });

    editProduct();
    res.json({ message: 'Produit mis à jour avec succès.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/products/:id/toggle-featured
router.put('/products/:id/toggle-featured', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = db.prepare('SELECT is_featured FROM products WHERE id = ?').get(id) as { is_featured: number } | undefined;
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }
    const nextState = product.is_featured === 1 ? 0 : 1;
    db.prepare('UPDATE products SET is_featured = ? WHERE id = ?').run(nextState, id);
    res.json({ message: 'Statut de mise en avant mis à jour.', is_featured: nextState });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/products/:id/toggle-bestseller
router.put('/products/:id/toggle-bestseller', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = db.prepare('SELECT is_bestseller FROM products WHERE id = ?').get(id) as { is_bestseller: number } | undefined;
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }
    const nextState = product.is_bestseller === 1 ? 0 : 1;
    db.prepare('UPDATE products SET is_bestseller = ? WHERE id = ?').run(nextState, id);
    res.json({ message: 'Statut de best seller mis à jour.', is_bestseller: nextState });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/products/:id/toggle-promo-featured
router.put('/products/:id/toggle-promo-featured', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = db.prepare('SELECT is_promo_featured FROM products WHERE id = ?').get(id) as { is_promo_featured: number } | undefined;
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }
    const nextState = product.is_promo_featured === 1 ? 0 : 1;
    db.prepare('UPDATE products SET is_promo_featured = ? WHERE id = ?').run(nextState, id);
    res.json({ message: 'Statut promotionnel mis à jour.', is_promo_featured: nextState });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/products/:id/toggle-outofstock
router.put('/products/:id/toggle-outofstock', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = db.prepare('SELECT is_out_of_stock FROM products WHERE id = ?').get(id) as { is_out_of_stock: number } | undefined;
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }
    const nextState = product.is_out_of_stock === 1 ? 0 : 1;
    db.prepare('UPDATE products SET is_out_of_stock = ? WHERE id = ?').run(nextState, id);
    res.json({ message: 'Statut de rupture de stock mis à jour.', is_out_of_stock: nextState });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/variants/:variantId/stock (Inline stock edit)
router.put('/variants/:variantId/stock', (req: Request, res: Response) => {
  const { variantId } = req.params;
  const { stock } = req.body;
  try {
    db.prepare('UPDATE product_variants SET stock = ? WHERE id = ?').run(parseInt(stock, 10) || 0, variantId);
    res.json({ message: 'Stock mis à jour avec succès.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/products/bulk (Bulk edit products)
router.put('/products/bulk', (req: Request, res: Response) => {
  const { ids, status } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Aucun produit sélectionné.' });
  }

  try {
    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE products SET status = ? WHERE id IN (${placeholders})`;
    db.prepare(query).run(status, ...ids);
    res.json({ message: 'Produits mis à jour avec succès.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/products/bulk (Bulk delete products)
router.delete('/products/bulk', (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Aucun produit sélectionné.' });
  }

  try {
    const placeholders = ids.map(() => '?').join(',');
    
    db.transaction(() => {
      // Remove references in order_items so we don't break historical orders
      db.prepare(`UPDATE order_items SET product_id = NULL, variant_id = NULL WHERE product_id IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).run(...ids);
    })();
    
    res.json({ message: 'Produits supprimés avec succès.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/products/:id (Delete product)
router.delete('/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    db.transaction(() => {
      // Remove references in order_items so we don't break historical orders
      db.prepare('UPDATE order_items SET product_id = NULL, variant_id = NULL WHERE product_id = ?').run(id);
      db.prepare('DELETE FROM products WHERE id = ?').run(id);
    })();
    res.json({ message: 'Produit supprimé avec succès.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/products/:id/images (Upload image)
router.post('/products/:id/images', upload.single('image'), (req: Request, res: Response) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ message: 'Fichier image manquant.' });
  }

  try {
    const url = `/uploads/${req.file.filename}`;
    
    // Check if product already has primary image
    const existingPrimary = db.prepare('SELECT id FROM product_images WHERE product_id = ? AND is_primary = 1').get(id);
    const isPrimary = existingPrimary ? 0 : 1;

    db.prepare(`
      INSERT INTO product_images (product_id, url, is_primary, sort_order)
      VALUES (?, ?, ?, 99)
    `).run(id, url, isPrimary);

    res.json({ message: 'Image téléversée avec succès.', url });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/products/:id/images/:imageId/primary (Set primary image)
router.put('/products/:id/images/:imageId/primary', (req: Request, res: Response) => {
  const { id, imageId } = req.params;
  try {
    const setPrimary = db.transaction(() => {
      db.prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?').run(id);
      db.prepare('UPDATE product_images SET is_primary = 1 WHERE id = ? AND product_id = ?').run(imageId, id);
    });
    setPrimary();
    res.json({ message: 'Image principale mise à jour.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/products/:id/images/:imageId (Delete image)
router.delete('/products/:id/images/:imageId', (req: Request, res: Response) => {
  const { id, imageId } = req.params;
  try {
    // Check if the deleted image is primary
    const img = db.prepare('SELECT is_primary FROM product_images WHERE id = ?').get(imageId) as { is_primary: number } | undefined;
    
    db.prepare('DELETE FROM product_images WHERE id = ? AND product_id = ?').run(imageId, id);
    
    // If deleted image was primary, make the first remaining image primary
    if (img && img.is_primary === 1) {
      const firstImg = db.prepare('SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1').get(id) as { id: number } | undefined;
      if (firstImg) {
        db.prepare('UPDATE product_images SET is_primary = 1 WHERE id = ?').run(firstImg.id);
      }
    }
    
    res.json({ message: 'Image supprimée avec succès.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/orders (List all orders)
router.get('/orders', (req: Request, res: Response) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as any[];
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/orders/:id (Get order details including items)
router.get('/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    const items = db.prepare(`
      SELECT oi.*, p.slug as product_slug, pi.url as primary_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_images pi ON oi.product_id = pi.product_id AND pi.is_primary = 1
      WHERE oi.order_id = ?
    `).all(order.id) as any[];

    res.json({
      ...order,
      items: items.map(item => ({
        ...item,
        primary_image: proxyImageUrl(item.primary_image)
      }))
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/orders/:id (Update order status or add admin notes)
router.put('/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    if (status && notes !== undefined) {
      db.prepare('UPDATE orders SET status = ?, notes = ? WHERE id = ?').run(status, notes, id);
    } else if (status) {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    } else if (notes !== undefined) {
      db.prepare('UPDATE orders SET notes = ? WHERE id = ?').run(notes, id);
    }

    res.json({ message: 'Commande mise à jour.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// CRUD for Categories
router.get('/categories', (req: Request, res: Response) => {
  try {
    const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
    res.json(cats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/categories', (req: Request, res: Response) => {
  const { name, parent_id, sort_order = 0 } = req.body;
  try {
    const slug = slugify(name);
    db.prepare(`
      INSERT INTO categories (name, slug, parent_id, sort_order)
      VALUES (?, ?, ?, ?)
    `).run(name, slug, parent_id || null, sort_order);
    res.status(201).json({ message: 'Catégorie créée.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// CRUD for Brands
router.get('/brands', (req: Request, res: Response) => {
  try {
    const brands = db.prepare('SELECT * FROM brands ORDER BY name ASC').all();
    res.json(brands);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/brands', (req: Request, res: Response) => {
  const { name, is_featured = 0 } = req.body;
  try {
    const slug = slugify(name);
    db.prepare(`
      INSERT INTO brands (name, slug, is_featured)
      VALUES (?, ?, ?)
    `).run(name, slug, is_featured ? 1 : 0);
    res.status(201).json({ message: 'Marque créée.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/brands/:id', (req: Request, res: Response) => {
  const { name, is_featured = 0 } = req.body;
  try {
    const slug = slugify(name);
    db.prepare(`
      UPDATE brands SET name = ?, slug = ?, is_featured = ?
      WHERE id = ?
    `).run(name, slug, is_featured ? 1 : 0, req.params.id);
    res.json({ message: 'Marque modifiée.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/brands/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id);
    res.json({ message: 'Marque supprimée.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// CRUD for Promo Codes
router.get('/promo-codes', (req: Request, res: Response) => {
  try {
    const promos = db.prepare('SELECT * FROM promo_codes ORDER BY id DESC').all();
    res.json(promos);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/promo-codes', (req: Request, res: Response) => {
  const { code, discount_type, discount_value, min_order = 0, usage_limit, expires_at } = req.body;
  try {
    db.prepare(`
      INSERT INTO promo_codes (code, discount_type, discount_value, min_order, usage_limit, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(code.toUpperCase(), discount_type, parseFloat(discount_value), parseFloat(min_order), usage_limit || null, expires_at || null);
    res.status(201).json({ message: 'Code promo créé.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/promo-codes/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM promo_codes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Code promo supprimé.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// CRUD for Bundles
router.get('/bundles', (req: Request, res: Response) => {
  try {
    const bundles = db.prepare('SELECT * FROM bundles ORDER BY id DESC').all() as any[];
    const enhanced = bundles.map(b => {
      const products = db.prepare(`
        SELECT p.id, p.name FROM products p
        JOIN bundle_products bp ON bp.product_id = p.id
        WHERE bp.bundle_id = ?
      `).all(b.id);
      return { ...b, products };
    });
    res.json(enhanced);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/bundles', (req: Request, res: Response) => {
  const { name, discount_percent, product_ids = [] } = req.body;
  try {
    const createBundle = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO bundles (name, discount_percent, is_active)
        VALUES (?, ?, 1)
      `).run(name, parseFloat(discount_percent));

      const bundleId = result.lastInsertRowid as number;

      const insertBP = db.prepare('INSERT INTO bundle_products (bundle_id, product_id) VALUES (?, ?)');
      product_ids.forEach((pId: number) => {
        insertBP.run(bundleId, pId);
      });
    });

    createBundle();
    res.status(201).json({ message: 'Bundle créé avec succès.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/bundles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    db.transaction(() => {
      // Because bundle_products has ON DELETE CASCADE, deleting the bundle removes its products links automatically
      db.prepare('DELETE FROM bundles WHERE id = ?').run(id);
    })();
    res.json({ message: 'Bundle supprimé avec succès.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Settings Management
router.get('/settings', (req: Request, res: Response) => {
  try {
    const settingsRows = db.prepare('SELECT key, value FROM site_settings').all() as { key: string, value: string }[];
    const settings = settingsRows.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/settings', (req: Request, res: Response) => {
  const settings = req.body; // Object of key-value pairs
  try {
    const updateSettings = db.transaction((settingsObj: Record<string, string>) => {
      const upsert = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
      for (const [key, value] of Object.entries(settingsObj)) {
        upsert.run(key, value);
      }
    });
    updateSettings(settings);
    res.json({ message: 'Paramètres mis à jour' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Categories CRUD
router.get('/categories', (req: Request, res: Response) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, parent_id, image_url, meta_title, meta_description, sort_order, is_featured } = req.body;
  try {
    db.prepare(`
      UPDATE categories SET 
        name = ?, slug = ?, parent_id = ?, image_url = ?, meta_title = ?, meta_description = ?, sort_order = ?, is_featured = ?
      WHERE id = ?
    `).run(name, slug, parent_id, image_url, meta_title, meta_description, sort_order, is_featured ? 1 : 0, id);
    res.json({ message: 'Catégorie mise à jour' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    db.transaction(() => {
      // Safely detatch products from this category
      db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(id);
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    })();
    res.json({ message: 'Catégorie supprimée.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Generic Upload
router.post('/upload', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier uploadé.' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// GET /api/admin/shipping-rates
router.get('/shipping-rates', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT id, city, cost FROM shipping_rates ORDER BY city ASC').all();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/shipping-rates
router.put('/shipping-rates', (req: Request, res: Response) => {
  const rates = req.body;
  try {
    const updateRates = db.transaction(() => {
      const stmt = db.prepare('INSERT INTO shipping_rates (city, cost) VALUES (?, ?) ON CONFLICT(city) DO UPDATE SET cost = excluded.cost');
      if (Array.isArray(rates)) {
        rates.forEach(r => stmt.run(r.city, parseFloat(r.cost)));
      } else {
        for (const [city, cost] of Object.entries(rates)) {
          stmt.run(city, parseFloat(cost as string));
        }
      }
    });
    updateRates();
    res.json({ message: 'Tarifs de livraison mis à jour' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- WooCommerce / WordPress Product Sync Section ---

interface SyncState {
  status: 'idle' | 'syncing' | 'success' | 'failed';
  currentStep: string;
  progress: number;
  logs: string[];
  lastSyncAt: string | null;
  error: string | null;
}

let syncState: SyncState = {
  status: 'idle',
  currentStep: 'Prêt à importer',
  progress: 0,
  logs: [],
  lastSyncAt: null,
  error: null
};

// Initialize last sync status from database on startup
try {
  const lastSyncRow = db.prepare("SELECT value FROM site_settings WHERE key = 'woocommerce_last_sync'").get() as { value: string } | undefined;
  if (lastSyncRow) {
    syncState.lastSyncAt = lastSyncRow.value;
  }
  const lastStatusRow = db.prepare("SELECT value FROM site_settings WHERE key = 'woocommerce_sync_status'").get() as { value: string } | undefined;
  if (lastStatusRow) {
    syncState.status = (lastStatusRow.value as any) || 'idle';
    if (syncState.status === 'success') {
      syncState.currentStep = 'Dernier import réussi';
      syncState.progress = 100;
    } else if (syncState.status === 'failed') {
      syncState.currentStep = "L'import précédent a échoué";
      syncState.progress = 0;
    }
  }
} catch (err) {
  console.error('Failed to load initial WooCommerce sync state:', err);
}

// GET /api/admin/woocommerce-import/status
router.get('/woocommerce-import/status', (req: Request, res: Response) => {
  res.json(syncState);
});

// POST /api/admin/woocommerce-import/sync
router.post('/woocommerce-import/sync', (req: Request, res: Response) => {
  if (syncState.status === 'syncing') {
    return res.status(400).json({ message: 'Une synchronisation est déjà en cours.' });
  }

  // Reset state for new sync
  syncState.status = 'syncing';
  syncState.currentStep = 'Démarrage de la synchronisation...';
  syncState.progress = 0;
  syncState.logs = [];
  syncState.error = null;

  const logMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    syncState.logs.push(`[${timestamp}] ${msg}`);
  };

  logMessage('Début de l\'importation WooCommerce...');

  // Execute import process in background
  (async () => {
    try {
      const result = await runWooCommerceImport((data) => {
        syncState.currentStep = data.step;
        syncState.progress = data.progress;
        if (data.log) {
          logMessage(data.log);
        } else {
          logMessage(data.step);
        }
      });

      syncState.status = 'success';
      syncState.progress = 100;
      syncState.currentStep = `Importation terminée ! ${result.importedCount} produits synchronisés.`;
      
      const now = new Date().toISOString();
      syncState.lastSyncAt = now;
      
      // Persist status in database site_settings
      db.prepare("INSERT INTO site_settings (key, value) VALUES ('woocommerce_last_sync', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(now);
      db.prepare("INSERT INTO site_settings (key, value) VALUES ('woocommerce_sync_status', 'success') ON CONFLICT(key) DO UPDATE SET value = excluded.value").run();
      
      logMessage(`Importation réussie : ${result.importedCount} produits synchronisés.`);
    } catch (err: any) {
      console.error('WooCommerce sync error:', err);
      const errMsg = err.message || 'Une erreur inconnue est survenue';
      syncState.status = 'failed';
      syncState.progress = 0;
      syncState.currentStep = `Erreur : ${errMsg}`;
      syncState.error = errMsg;
      
      db.prepare("INSERT INTO site_settings (key, value) VALUES ('woocommerce_sync_status', 'failed') ON CONFLICT(key) DO UPDATE SET value = excluded.value").run();
      
      logMessage(`ERREUR : ${errMsg}`);
    }
  })();

  res.json({ message: 'La synchronisation a démarré en arrière-plan.' });
});

export default router;
