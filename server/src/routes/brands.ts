import { Router } from 'express';
import db from '../db/database.ts';
import { proxyImageUrl } from '../utils/imageProxy.ts';

const router = Router();

// GET /api/brands
router.get('/', (req, res) => {
  try {
    const brands = db.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.status = 'published') as product_count
      FROM brands b
      ORDER BY b.name ASC
    `).all() as any[];

    res.json(brands);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/brands/:slug/products
router.get('/:slug/products', (req, res) => {
  const { slug } = req.params;
  try {
    const brand = db.prepare('SELECT * FROM brands WHERE slug = ?').get(slug) as any;
    if (!brand) {
      return res.status(404).json({ message: 'Marque non trouvée.' });
    }

    const products = db.prepare(`
      SELECT p.*, b.name as brand_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.brand_id = ? AND p.status = 'published'
    `).all(brand.id) as any[];

    const enhanced = products.map(p => {
      const primaryImage = db.prepare('SELECT url FROM product_images WHERE product_id = ? AND is_primary = 1').get(p.id) as { url: string } | undefined;
      return {
        ...p,
        primary_image: proxyImageUrl(primaryImage ? primaryImage.url : 'https://picsum.photos/seed/default/600/600')
      };
    });

    res.json({ brand, products: enhanced });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
