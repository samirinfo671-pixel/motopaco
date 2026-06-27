import { Router } from 'express';
import db from '../db/database.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/products (List with filters)
router.get('/', (req, res) => {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    sort,
    search,
    page = '1',
    limit = '12',
    inStockOnly = 'false',
    promotions = 'false',
    sizes,
    color
  } = req.query;

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 12;
  const offset = (pageNum - 1) * limitNum;

  try {
    let query = `
      SELECT p.*, b.name as brand_name, c.name as category_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
    `;
    const params: any[] = [];

const CATEGORY_SLUG_MAP: Record<string, string> = {
  'casques': 'casques-moto',
  'gants': 'gants-moto',
  'bottes': 'bottes-moto',
  'bagagerie': 'bagagerie-moto',
  'vestes-blousons': 'jackets',
  'echappements': 'echappement-moto',
  'kit-chaine': 'kit-chaine-moto',
  'accessoires-usb': 'support-pour-telephone-portable',
  'pantalons': 'pantalon-moto',
  'sacoches': 'sacoche-moto',
  'protections': 'protection-moteur-cadre'
};

    if (category) {
      // Allow filtering by category slug or parent category slug
      const mappedSlug = CATEGORY_SLUG_MAP[category as string] || category;
      query += ` AND (c.slug = ? OR c.parent_id = (SELECT id FROM categories WHERE slug = ?))`;
      params.push(mappedSlug, mappedSlug);
    }

    if (brand) {
      query += ` AND b.slug = ?`;
      params.push(brand);
    }

    if (minPrice) {
      query += ` AND COALESCE(p.sale_price, p.base_price) >= ?`;
      params.push(parseFloat(minPrice as string));
    }

    if (maxPrice) {
      query += ` AND COALESCE(p.sale_price, p.base_price) <= ?`;
      params.push(parseFloat(maxPrice as string));
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.short_description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (promotions === 'true') {
      query += ` AND (p.sale_price IS NOT NULL OR p.is_promo_featured = 1)`;
    }

    if (inStockOnly === 'true') {
      query += ` AND p.is_out_of_stock = 0 AND (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id) > 0`;
    }

    if (sizes) {
      const sizeList = (sizes as string).split(',');
      const sizePlaceholders = sizeList.map(() => '?').join(',');
      query += ` AND p.id IN (SELECT product_id FROM product_variants WHERE size IN (${sizePlaceholders}))`;
      params.push(...sizeList);
    }

    if (color) {
      query += ` AND p.id IN (SELECT product_id FROM product_variants WHERE color LIKE ?)`;
      params.push(`%${color}%`);
    }

    // Add sorting
    if (sort === 'price-asc') {
      query += ` ORDER BY COALESCE(p.sale_price, p.base_price) ASC`;
    } else if (sort === 'price-desc') {
      query += ` ORDER BY COALESCE(p.sale_price, p.base_price) DESC`;
    } else if (sort === 'newest') {
      query += ` ORDER BY p.created_at DESC`;
    } else if (sort === 'rating') {
      query += ` ORDER BY (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) DESC`;
    } else {
      // default: popularity (defined by order count or just default order)
      if (promotions === 'true') {
        query += ` ORDER BY p.is_promo_featured DESC, p.id DESC`;
      } else {
        query += ` ORDER BY p.id DESC`;
      }
    }

    // Clone query to count total records before pagination
    const countQuery = `SELECT count(*) as count FROM (${query})`;
    const totalCount = (db.prepare(countQuery).get(...params) as { count: number }).count;

    // Apply pagination
    query += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const products = db.prepare(query).all(...params) as any[];

    // Attach primary images & stock information to each product
    const enhancedProducts = products.map(p => {
      const primaryImage = db.prepare('SELECT url FROM product_images WHERE product_id = ? AND is_primary = 1').get(p.id) as { url: string } | undefined;
      const totalStock = db.prepare('SELECT SUM(stock) as stock FROM product_variants WHERE product_id = ?').get(p.id) as { stock: number } | undefined;
      const avgRating = db.prepare('SELECT AVG(rating) as rating, COUNT(*) as count FROM reviews WHERE product_id = ?').get(p.id) as { rating: number | null; count: number } | undefined;

      // If explicitly out of stock, show 0. If no variants at all but not OOS-flagged, default to 10 (in stock)
      let computedStock = 0;
      if (p.is_out_of_stock === 1) {
        computedStock = 0;
      } else if (totalStock && totalStock.stock > 0) {
        computedStock = totalStock.stock;
      } else if (!totalStock || totalStock.stock === 0) {
        // No variants in DB but not explicitly OOS — treat as in stock
        computedStock = 10;
      }

      return {
        ...p,
        primary_image: primaryImage ? primaryImage.url : 'https://picsum.photos/seed/default/600/600',
        total_stock: computedStock,
        rating: avgRating && avgRating.rating ? Math.round(avgRating.rating * 10) / 10 : 0,
        review_count: avgRating ? avgRating.count : 0
      };
    });

    res.json({
      products: enhancedProducts,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/featured
router.get('/featured', (req, res) => {
  try {
    const limitRow = db.prepare("SELECT value FROM site_settings WHERE key = 'home_featured_limit'").get() as { value: string } | undefined;
    const limit = limitRow ? parseInt(limitRow.value, 10) || 8 : 8;

    const products = db.prepare(`
      SELECT p.*, b.name as brand_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'published'
      ORDER BY p.sold_count DESC
      LIMIT ?
    `).all(limit) as any[];

    const enhanced = products.map(p => {
      const primaryImage = db.prepare('SELECT url FROM product_images WHERE product_id = ? AND is_primary = 1').get(p.id) as { url: string } | undefined;
      const totalStock = db.prepare('SELECT SUM(stock) as stock FROM product_variants WHERE product_id = ?').get(p.id) as { stock: number } | undefined;
      const avgRating = db.prepare('SELECT AVG(rating) as rating, COUNT(*) as count FROM reviews WHERE product_id = ?').get(p.id) as { rating: number | null; count: number } | undefined;
      const computedStock = p.is_out_of_stock === 1 ? 0 : (totalStock && totalStock.stock > 0 ? totalStock.stock : 10);
      return {
        ...p,
        primary_image: primaryImage ? primaryImage.url : 'https://picsum.photos/seed/default/600/600',
        total_stock: computedStock,
        rating: avgRating && avgRating.rating ? Math.round(avgRating.rating * 10) / 10 : 0,
        review_count: avgRating ? avgRating.count : 0
      };
    });

    res.json(enhanced);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/new-arrivals
router.get('/new-arrivals', (req, res) => {
  try {
    const limitRow = db.prepare("SELECT value FROM site_settings WHERE key = 'home_new_arrivals_limit'").get() as { value: string } | undefined;
    const limit = limitRow ? parseInt(limitRow.value, 10) || 8 : 8;

    const products = db.prepare(`
      SELECT p.*, b.name as brand_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(limit) as any[];

    const enhanced = products.map(p => {
      const primaryImage = db.prepare('SELECT url FROM product_images WHERE product_id = ? AND is_primary = 1').get(p.id) as { url: string } | undefined;
      const totalStock = db.prepare('SELECT SUM(stock) as stock FROM product_variants WHERE product_id = ?').get(p.id) as { stock: number } | undefined;
      const avgRating = db.prepare('SELECT AVG(rating) as rating, COUNT(*) as count FROM reviews WHERE product_id = ?').get(p.id) as { rating: number | null; count: number } | undefined;
      const computedStock = p.is_out_of_stock === 1 ? 0 : (totalStock && totalStock.stock > 0 ? totalStock.stock : 10);
      return {
        ...p,
        primary_image: primaryImage ? primaryImage.url : 'https://picsum.photos/seed/default/600/600',
        total_stock: computedStock,
        rating: avgRating && avgRating.rating ? Math.round(avgRating.rating * 10) / 10 : 0,
        review_count: avgRating ? avgRating.count : 0
      };
    });

    res.json(enhanced);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/:slug (Single product detail)
router.get('/:slug', (req, res) => {
  const { slug } = req.params;

  try {
    const product = db.prepare(`
      SELECT p.*, b.name as brand_name, b.logo_url as brand_logo, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.status = 'published'
    `).get(slug) as any;

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }

    // Fetch images
    const images = db.prepare(`
      SELECT url, is_primary FROM product_images
      WHERE product_id = ?
      ORDER BY sort_order ASC
    `).all(product.id) as any[];

    // Fetch variants
    let variants = db.prepare(`
      SELECT id, size, color, sku, stock, low_stock_threshold, image_url, description FROM product_variants
      WHERE product_id = ?
    `).all(product.id) as any[];

    if (product.is_out_of_stock === 1) {
      variants = variants.map(v => ({ ...v, stock: 0 }));
    }

    // If no variants exist (e.g. old seed data), inject a synthetic in-stock variant
    // so the frontend never incorrectly shows "Rupture de stock"
    if (variants.length === 0 && product.is_out_of_stock !== 1) {
      variants = [{
        id: 0,
        product_id: product.id,
        size: 'Taille Unique',
        color: 'Standard',
        sku: `${product.slug}-default`,
        stock: 10,
        low_stock_threshold: 3,
        image_url: null,
        description: 'Variante standard'
      }];
    }

    // Fetch average rating
    const avgRating = db.prepare('SELECT AVG(rating) as rating, COUNT(*) as count FROM reviews WHERE product_id = ?').get(product.id) as { rating: number | null; count: number } | undefined;

    const primaryImage = images.find(img => img.is_primary === 1) || images[0];

    res.json({
      ...product,
      primary_image: primaryImage ? primaryImage.url : 'https://picsum.photos/seed/default/600/600',
      images,
      variants,
      rating: avgRating && avgRating.rating ? Math.round(avgRating.rating * 10) / 10 : 0,
      review_count: avgRating ? avgRating.count : 0
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/:id/reviews
router.get('/:id/reviews', (req, res) => {
  const { id } = req.params;

  try {
    const reviews = db.prepare(`
      SELECT r.*, u.first_name, u.last_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(id) as any[];

    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/products/:id/reviews (Auth required)
router.post('/:id/reviews', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { rating, title, body } = req.body;
  const userId = req.user?.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'La note doit être comprise entre 1 et 5.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO reviews (product_id, user_id, rating, title, body, is_verified)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(id, userId, rating, title || '', body || '');

    res.status(201).json({
      id: result.lastInsertRowid,
      product_id: parseInt(id, 10),
      user_id: userId,
      rating,
      title,
      body,
      is_verified: 1,
      created_at: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
