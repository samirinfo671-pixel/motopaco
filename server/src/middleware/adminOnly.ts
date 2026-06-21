import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.ts';

export function adminOnly(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
  }
  next();
}
