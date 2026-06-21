import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.ts';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.ts';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, first_name, last_name, phone } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ message: 'Cet email est déjà enregistré.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
      VALUES (?, ?, ?, ?, ?, 'customer')
    `).run(email, hash, first_name || '', last_name || '', phone || '');

    const user = { id: result.lastInsertRowid as number, email, role: 'customer' };
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, email, first_name, last_name, phone, role: 'customer' }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token requis.' });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return res.status(401).json({ message: 'Session expirée, veuillez vous reconnecter.' });
  }

  const newAccess = generateAccessToken({ id: payload.id, email: payload.email, role: payload.role });
  const newRefresh = generateRefreshToken({ id: payload.id, email: payload.email, role: payload.role });

  res.json({ accessToken: newAccess, refreshToken: newRefresh });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Déconnexion réussie.' });
});

export default router;
