import { Router } from 'express';
import db from '../db/database.ts';

const router = Router();

// POST /api/promo/validate
router.post('/validate', (req, res) => {
  const { code, orderTotal = 0 } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Code promo requis.' });
  }

  try {
    const promo = db.prepare(`
      SELECT * FROM promo_codes 
      WHERE code = ? AND is_active = 1
    `).get(code) as any;

    if (!promo) {
      return res.status(404).json({ message: 'Code promo invalide.' });
    }

    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Ce code promo a expiré.' });
    }

    // Check usage limits
    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      return res.status(400).json({ message: 'Limite d\'utilisation atteinte pour ce code.' });
    }

    // Check minimum order amount
    if (promo.min_order && orderTotal < promo.min_order) {
      return res.status(400).json({ 
        message: `Ce code nécessite un montant minimum de commande de ${promo.min_order} DH.` 
      });
    }

    res.json({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      message: 'Code promo appliqué avec succès.'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
