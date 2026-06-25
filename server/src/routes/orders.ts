import { Router } from 'express';
import db from '../db/database.ts';
import { generateOrderNumber } from '../utils/orderNumber.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';
import { sendOrderEmails } from '../utils/mailer.ts';
import { sendWhatsAppAlert } from '../utils/whatsapp.ts';

const router = Router();

// POST /api/orders (Create Order)
router.post('/', (req, res) => {
  const {
    user_id,
    shipping_first_name,
    shipping_last_name,
    shipping_phone,
    shipping_email,
    shipping_address,
    shipping_city,
    shipping_zip,
    delivery_method = 'standard',
    payment_method = 'cod',
    items = [], // Array of { product_id, variant_id, quantity }
    promo_code,
    notes,
    source = 'Direct'
  } = req.body;

  if (items.length === 0) {
    return res.status(400).json({ message: 'Le panier est vide.' });
  }
  if (!shipping_first_name || !shipping_last_name || !shipping_phone || !shipping_address || !shipping_city) {
    return res.status(400).json({ message: 'Informations de livraison incomplètes.' });
  }

  try {
    let subtotal = 0;
    const validatedItems: any[] = [];

    // Begin a database transaction
    const executeCheckout = db.transaction(() => {
      // 1. Validate items, pricing & stock
      for (const item of items) {
        const product = db.prepare(`SELECT * FROM products WHERE id = ? AND status = 'published'`).get(item.product_id) as any;
        if (!product) {
          throw new Error(`Produit #${item.product_id} introuvable ou archivé.`);
        }

        const variant = db.prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ?').get(item.variant_id, item.product_id) as any;
        if (!variant) {
          throw new Error(`Variante #${item.variant_id} introuvable pour le produit ${product.name}.`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(`Stock insuffisant pour ${product.name} (taille/couleur: ${variant.size || 'Unique'}). Stock disponible: ${variant.stock}.`);
        }

        // Determine price (normal vs sale price vs variant override)
        let unitPrice = product.sale_price !== null ? product.sale_price : product.base_price;
        if (variant.price_override !== null && variant.price_override !== undefined) {
          unitPrice = variant.price_override;
        }
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        // Decrement variant stock
        db.prepare('UPDATE product_variants SET stock = stock - ? WHERE id = ?').run(item.quantity, item.variant_id);

        validatedItems.push({
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: product.name,
          variant_label: `${variant.size || ''} ${variant.color || ''}`.trim(),
          quantity: item.quantity,
          unit_price: unitPrice,
          line_total: lineTotal
        });
      }

      // 2. Validate Promo Code & Calculate discount
      let discountAmount = 0;
      if (promo_code) {
        const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1').get(promo_code) as any;
        if (promo) {
          // Check expiry
          const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
          const isBelowMinOrder = promo.min_order && subtotal < promo.min_order;
          const isLimitReached = promo.usage_limit && promo.used_count >= promo.usage_limit;

          if (!isExpired && !isBelowMinOrder && !isLimitReached) {
            if (promo.discount_type === 'percent') {
              discountAmount = Math.round((subtotal * (promo.discount_value / 100)) * 100) / 100;
            } else if (promo.discount_type === 'fixed') {
              discountAmount = promo.discount_value;
            }
            // Increment coupon used count
            db.prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?').run(promo.id);
          }
        }
      }

      // 3. Shipping costs (Moroccan settings)
      let shippingCost = 40; // default flat rate
      if (delivery_method === 'retrait') {
        shippingCost = 0;
      } else if (subtotal >= 2000) {
        shippingCost = 0; // free shipping above 2000 DH
      } else {
        const rateRow = db.prepare('SELECT cost FROM shipping_rates WHERE city = ?').get(shipping_city) as { cost: number } | undefined;
        if (rateRow) {
          shippingCost = rateRow.cost;
        }
      }

      const total = subtotal - discountAmount + shippingCost;
      const orderNumber = generateOrderNumber();

      // 4. Create Order
      const insertOrder = db.prepare(`
        INSERT INTO orders (
          order_number, user_id, status, subtotal, shipping_cost, discount_amount, total, payment_method,
          shipping_first_name, shipping_last_name, shipping_phone, shipping_address, shipping_city, shipping_zip, notes, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const orderResult = insertOrder.run(
        orderNumber,
        user_id || null,
        'pending',
        subtotal,
        shippingCost,
        discountAmount,
        total,
        payment_method,
        shipping_first_name,
        shipping_last_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_zip || '',
        notes || '',
        source || 'Direct'
      );

      const orderId = orderResult.lastInsertRowid as number;

      // 5. Create Order Items
      const insertOrderItem = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, variant_id, product_name, variant_label, quantity, unit_price, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of validatedItems) {
        insertOrderItem.run(
          orderId,
          item.product_id,
          item.variant_id,
          item.product_name,
          item.variant_label,
          item.quantity,
          item.unit_price,
          item.line_total
        );

        // Update sold_count in products table for metrics-based best sellers
        db.prepare('UPDATE products SET sold_count = sold_count + ? WHERE id = ?').run(
          item.quantity,
          item.product_id
        );

        // Decrement variant stock
        db.prepare('UPDATE product_variants SET stock = MAX(0, stock - ?) WHERE id = ?').run(
          item.quantity,
          item.variant_id
        );
      }

      return {
        id: orderId,
        order_number: orderNumber,
        total,
        subtotal,
        shipping_cost: shippingCost,
        discount_amount: discountAmount
      };
    });

    const result = executeCheckout();
    
    // Trigger notification routines (non-blocking)
    try {
      const orderRecord = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.id) as any;
      const itemsRecords = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(result.id) as any[];
      
      // Send email notifications
      sendOrderEmails({ ...orderRecord, shipping_email }, itemsRecords).catch(err => console.error('Error sending order emails:', err));
      
      // Trigger WhatsApp notifications
      sendWhatsAppAlert(orderRecord, itemsRecords).catch(err => console.error('Error sending WhatsApp alert:', err));
    } catch (notifyErr) {
      console.error('Error triggering post-order notification routine:', notifyErr);
    }

    res.status(201).json({
      message: 'Commande enregistrée avec succès.',
      order: result
    });

  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/orders/:orderNumber (Tracking - secure check by phone)
router.get('/:orderNumber', (req, res) => {
  const { orderNumber } = req.params;
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ message: 'Numéro de téléphone requis pour le suivi.' });
  }

  try {
    const order = db.prepare(`
      SELECT * FROM orders 
      WHERE order_number = ? AND (shipping_phone = ? OR shipping_phone LIKE ?)
    `).get(orderNumber, phone, `%${phone}`) as any;

    if (!order) {
      return res.status(404).json({ message: 'Aucune commande trouvée correspondante.' });
    }

    // Get order items
    const items = db.prepare(`
      SELECT oi.*, p.slug as product_slug, pi.url as primary_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_images pi ON oi.product_id = pi.product_id AND pi.is_primary = 1
      WHERE oi.order_id = ?
    `).all(order.id) as any[];

    res.json({
      ...order,
      items
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/account/orders (Auth required)
router.get('/customer/history', authMiddleware, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;

  try {
    const orders = db.prepare(`
      SELECT * FROM orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(userId) as any[];

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
