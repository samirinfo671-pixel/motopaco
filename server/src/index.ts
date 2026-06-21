import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { seedDatabase } from './db/seed.ts';
import authRouter from './routes/auth.ts';
import productsRouter from './routes/products.ts';
import categoriesRouter from './routes/categories.ts';
import brandsRouter from './routes/brands.ts';
import bundlesRouter from './routes/bundles.ts';
import promoRouter from './routes/promo.ts';
import ordersRouter from './routes/orders.ts';
import adminRouter from './routes/admin.ts';
import settingsRouter from './routes/settings.ts';
import { errorHandler } from './middleware/errorHandler.ts';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Configure CORS
app.use(cors({
  origin: '*', // For demo compatibility
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded assets statically
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Seed the database on boot
try {
  seedDatabase();
} catch (error) {
  console.error('Seeding during server startup failed:', error);
}

// Register API Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/bundles', bundlesRouter);
app.use('/api/promo', promoRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/settings', settingsRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`[MOTO PACO API] Server running on http://localhost:${PORT}`);
});
