import { Router } from 'express';
import db from '../db/database.ts';

const router = Router();

// GET /api/settings
router.get('/', (req, res) => {
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

// GET /api/settings/shipping-rates
router.get('/shipping-rates', (req, res) => {
  try {
    const rows = db.prepare('SELECT city, cost FROM shipping_rates').all() as { city: string, cost: number }[];
    const rates = rows.reduce((acc, curr) => {
      acc[curr.city] = curr.cost;
      return acc;
    }, {} as Record<string, number>);
    res.json(rates);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
