import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error caught by Express handler:', err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Une erreur interne est survenue sur le serveur.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
}
