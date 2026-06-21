import { Router } from 'express';
import db from '../db/database.ts';

const router = Router();

// GET /api/bundles
router.get('/', (req, res) => {
  try {
    const bundles = db.prepare('SELECT * FROM bundles WHERE is_active = 1').all() as any[];

    const result = bundles.map(b => {
      const products = db.prepare(`
        SELECT p.id, p.name, p.slug, p.base_price, p.sale_price, b.name as brand_name
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        JOIN bundle_products bp ON bp.product_id = p.id
        WHERE bp.bundle_id = ? AND p.status = 'published'
      `).all(b.id) as any[];

      const productsWithImage = products.map(p => {
        const primaryImage = db.prepare('SELECT url FROM product_images WHERE product_id = ? AND is_primary = 1').get(p.id) as { url: string } | undefined;
        return {
          ...p,
          primary_image: primaryImage ? primaryImage.url : 'https://picsum.photos/seed/default/600/600'
        };
      });

      return {
        ...b,
        products: productsWithImage
      };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/bundles/for-product/:productId
router.get('/for-product/:productId', (req, res) => {
  const { productId } = req.params;
  try {
    const bundles = db.prepare(`
      SELECT b.* FROM bundles b
      JOIN bundle_products bp ON bp.bundle_id = b.id
      WHERE bp.product_id = ? AND b.is_active = 1
    `).all(productId) as any[];

    const result = bundles.map(b => {
      const products = db.prepare(`
        SELECT p.id, p.name, p.slug, p.base_price, p.sale_price, br.name as brand_name
        FROM products p
        LEFT JOIN brands br ON p.brand_id = br.id
        JOIN bundle_products bp ON bp.product_id = p.id
        WHERE bp.bundle_id = ? AND p.status = 'published'
      `).all(b.id) as any[];

      const productsWithImage = products.map(p => {
        const primaryImage = db.prepare('SELECT url FROM product_images WHERE product_id = ? AND is_primary = 1').get(p.id) as { url: string } | undefined;
        return {
          ...p,
          primary_image: primaryImage ? primaryImage.url : 'https://picsum.photos/seed/default/600/600'
        };
      });

      return {
        ...b,
        products: productsWithImage
      };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
