# 🏍️ PACK MOTO — Full-Stack Moto Accessories E-Commerce Store

Production-ready full-stack moto accessories and equipment store customized for the Moroccan e-commerce market. Built using **React + Vite + TypeScript + Zustand** on the frontend and **Node.js + Express + SQLite** on the backend.

---

## 🏎️ Features

1. **Dark Industrial Luxury Theme**: Inspired by Ducati and Akrapovic race setups, incorporating customized Barlow Condensed typography and an SVG-based looping fractal noise overlay.
2. **Moroccan Market Localization**: Price displays matching `1 299,00 DH` format, shipping rules (FREE above 2000 DH), customer phone validation, pre-filled floating WhatsApp helper chat widgets, and dropdown selector of ~30 Moroccan cities.
3. **Advanced Upsell & Bundle Engine**: Automatic calculation of progressive volume discounts (e.g. 5% off for 2 items, 10% off for 3+ items) and pre-built bundle savings (e.g. Casque AGV + Gants Dainese = -10% Off). 1-Click addition buttons to complete bundles directly inside the shopping cart.
4. **Universal Ads Tracking Pixels**: Structured hooks and manager script initializing and triggering conversions for:
   - Facebook/Meta Pixel
   - Google Tag Manager (GTM / GA4)
   - TikTok Pixel
   - Snapchat Pixel
5. **Robust Admin Panel**: Restricted role gating (`role: 'admin'`) hidden on mobile view screens. Tracks sales KPI cards (revenues, pending counts, alert thresholds), mounts Recharts sales charts, product additions forms, details modal for shipping invoices, and inline variant quantity stock editors.
6. **SQLite DB Zero-Config**: SQLite database (`better-sqlite3` driver) initializing and seeding default products, category trees, bundle rules, and reviews on boot.

---

## 🛠️ Monorepo Structure

- `/package.json`: Orchestrates scripts using `concurrently`.
- `/client/`: Vite + React + TS frontend on port 5173.
- `/server/`: Express + TS + SQLite api on port 5000.

---

## 🚀 Getting Started

### 1. Installation

Run the custom install helper script inside the project root:
```bash
npm run install:all
```
This runs `npm install` recursively inside the root, `/client`, and `/server` folders.

### 2. Configuration (Optional)

Configure your tracking pixel IDs by copying `.env` variables (placeholders are pre-configured in code by default):
Create `/client/.env.local`:
```env
VITE_META_PIXEL_ID=YOUR_META_PIXEL_ID
VITE_TIKTOK_PIXEL_ID=YOUR_TIKTOK_PIXEL_ID
VITE_SNAP_PIXEL_ID=YOUR_SNAP_PIXEL_ID
VITE_GTM_ID=YOUR_GTM_ID
```

### 3. Start Development Servers

Run the concurrently boot script:
```bash
npm run dev
```
This boots both:
- **Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 🔐 Admin Credentials

To manage categories, orders, coupons, and stock, log in at `http://localhost:5173/admin/login` or via the account tab using:
- **Email**: `admin@packmoto.ma`
- **Password**: `admin123`

---

## 📡 API Endpoints Overview

### Authentications
- `POST /api/auth/register` - Create shopper profile.
- `POST /api/auth/login` - Validate logins, sign access/refresh JWTs.
- `POST /api/auth/refresh` - Refresh tokens.
- `POST /api/auth/logout` - Invalidate sessions.

### Public Products & Catalogues
- `GET /api/products` - Paginated and sorted products listing with filters.
- `GET /api/products/:slug` - Detail information, image array, and variant configurations.
- `GET /api/products/new-arrivals` - Recent products.
- `GET /api/products/featured` - Bestsellers catalog.
- `GET /api/categories` - Parent-child category nesting tree.
- `GET /api/brands` - Brands list.
- `GET /api/bundles` - Active bundle discounts.
- `POST /api/promo/validate` - Checks voucher validity, expiry times, and purchase thresholds.

### Checkout Transactions
- `POST /api/orders` - Place COD or Card simulated order, performs safety stock checks, decrements inventory, and increments coupon uses.
- `GET /api/orders/:orderNumber?phone=...` - Safe tracking information.

### Administration Actions (Gated by adminOnly JWT)
- `GET /api/admin/dashboard` - KPI statistics and sales history Recharts format.
- `GET/POST/PUT/DELETE /api/admin/products` - CRUD product metadata and variants.
- `POST /api/admin/products/:id/images` - Upload images via multer.
- `PUT /api/admin/variants/:variantId/stock` - Inline variant stock changes.
- `GET/PUT /api/admin/orders` - Update shipment status steps or add notes.
- `GET/POST/DELETE /api/admin/promo-codes` - Voucher codes.
- `GET/POST/DELETE /api/admin/bundles` - Combo package settings.
