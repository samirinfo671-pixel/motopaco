import { Router } from 'express';
import db from '../db/database.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';
import { proxyImageUrl } from '../utils/imageProxy.ts';

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

    if (category) {
      // Allow filtering by category slug or parent category slug
      query += ` AND (c.slug = ? OR c.parent_id = (SELECT id FROM categories WHERE slug = ?))`;
      params.push(category, category);
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

      return {
        ...p,
        primary_image: proxyImageUrl(primaryImage ? primaryImage.url : 'https://picsum.photos/seed/default/600/600'),
        total_stock: p.is_out_of_stock === 1 ? 0 : (totalStock ? totalStock.stock || 0 : 0),
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
      ORDER BY p.is_bestseller DESC, p.sold_count DESC
      LIMIT ?
    `).all(limit) as any[];

    const enhanced = products.map(p => {
      const primaryImage = db.prepare('SELECT url FROM product_images WHERE product_id = ? AND is_primary = 1').get(p.id) as { url: string } | undefined;
      const totalStock = db.prepare('SELECT SUM(stock) as stock FROM product_variants WHERE product_id = ?').get(p.id) as { stock: number } | undefined;
      const avgRating = db.prepare('SELECT AVG(rating) as rating, COUNT(*) as count FROM reviews WHERE product_id = ?').get(p.id) as { rating: number | null; count: number } | undefined;

      return {
        ...p,
        primary_image: proxyImageUrl(primaryImage ? primaryImage.url : 'https://picsum.photos/seed/default/600/600'),
        total_stock: p.is_out_of_stock === 1 ? 0 : (totalStock ? totalStock.stock || 0 : 0),
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
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT ?
    `).all(limit) as any[];

    const enhanced = products.map(p => {
      const primaryImage = db.prepare('SELECT url FROM product_images WHERE product_id = ? AND is_primary = 1').get(p.id) as { url: string } | undefined;
      const totalStock = db.prepare('SELECT SUM(stock) as stock FROM product_variants WHERE product_id = ?').get(p.id) as { stock: number } | undefined;
      const avgRating = db.prepare('SELECT AVG(rating) as rating, COUNT(*) as count FROM reviews WHERE product_id = ?').get(p.id) as { rating: number | null; count: number } | undefined;

      return {
        ...p,
        primary_image: proxyImageUrl(primaryImage ? primaryImage.url : 'https://picsum.photos/seed/default/600/600'),
        total_stock: p.is_out_of_stock === 1 ? 0 : (totalStock ? totalStock.stock || 0 : 0),
        rating: avgRating && avgRating.rating ? Math.round(avgRating.rating * 10) / 10 : 0,
        review_count: avgRating ? avgRating.count : 0
      };
    });

    res.json(enhanced);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/image-proxy
router.get('/image-proxy', async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: "URL d'image manquante ou invalide." });
  }

  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ message: "Seules les URLs HTTP/HTTPS sont autorisées." });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://motopaco.ma/',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ message: `Erreur de chargement de l'image distante: ${response.statusText}` });
    }

    const contentType = response.headers.get('content-type');
    const cacheControl = response.headers.get('cache-control');

    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    if (cacheControl) {
      res.setHeader('Cache-Control', cacheControl);
    } else {
      res.setHeader('Cache-Control', 'public, max-age=604800'); // Cache for 7 days
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.send(buffer);
  } catch (error: any) {
    console.error('Image proxy error:', error);
    return res.status(500).json({ message: `Erreur interne du proxy d'image: ${error.message}` });
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

    // Fetch average rating
    const avgRating = db.prepare('SELECT AVG(rating) as rating, COUNT(*) as count FROM reviews WHERE product_id = ?').get(product.id) as { rating: number | null; count: number } | undefined;

    const primaryImage = images.find(img => img.is_primary === 1) || images[0];

    res.json({
      ...product,
      primary_image: proxyImageUrl(primaryImage ? primaryImage.url : 'https://picsum.photos/seed/default/600/600'),
      images: images.map(img => ({ ...img, url: proxyImageUrl(img.url) })),
      variants: variants.map(v => ({ ...v, image_url: proxyImageUrl(v.image_url) })),
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
