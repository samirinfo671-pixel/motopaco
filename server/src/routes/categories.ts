import { Router } from 'express';
import db from '../db/database.ts';
import { proxyImageUrl } from '../utils/imageProxy.ts';

const router = Router();

// GET /api/categories (returns nested parent-child tree with product counts)
router.get('/', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'published') as product_count
      FROM categories c
      ORDER BY c.sort_order ASC
    `).all() as any[];

    const parents = categories.filter(c => c.parent_id === null);
    const result = parents.map(parent => {
      const subs = categories.filter(c => c.parent_id === parent.id);
      return {
        ...parent,
        image_url: proxyImageUrl(parent.image_url),
        subcategories: subs.map(sub => ({
          ...sub,
          image_url: proxyImageUrl(sub.image_url)
        })),
        total_products: parent.product_count + subs.reduce((acc, sub) => acc + sub.product_count, 0)
      };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/categories/:slug
router.get('/:slug', (req, res) => {
  const { slug } = req.params;
  try {
    const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug) as any;
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée.' });
    }
    category.image_url = proxyImageUrl(category.image_url);
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
