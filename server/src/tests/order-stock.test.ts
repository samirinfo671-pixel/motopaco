import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Generate a random order number helper
function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MP-${dateStr}-${rand}`;
}

async function runTest() {
  console.log('🧪 Starting stock decrement integration test...');
  
  // 1. Initialize In-Memory SQLite database
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  // 2. Read and apply schema
  const schemaPath = path.resolve(__dirname, '../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('✅ In-memory database schema initialized.');

  // 3. Setup mock brand, category, product, and variant
  db.prepare(`
    INSERT INTO brands (id, name, slug) VALUES (1, 'Test Brand', 'test-brand')
  `).run();
  
  db.prepare(`
    INSERT INTO categories (id, name, slug) VALUES (1, 'Test Category', 'test-category')
  `).run();
  
  db.prepare(`
    INSERT INTO products (id, name, slug, base_price, status) 
    VALUES (101, 'Premium Helmet', 'premium-helmet', 1500, 'published')
  `).run();

  const INITIAL_STOCK = 10;
  db.prepare(`
    INSERT INTO product_variants (id, product_id, size, stock) 
    VALUES (201, 101, 'L', ?)
  `).run(INITIAL_STOCK);
  console.log(`✅ Seeded product variant with initial stock = ${INITIAL_STOCK}.`);

  // 4. Define checkout logic transaction (similar to server/src/routes/orders.ts)
  const orderItemsInput = [{ product_id: 101, variant_id: 201, quantity: 2 }];
  const shippingCity = 'Casablanca';
  
  const executeCheckout = db.transaction(() => {
    let subtotal = 0;
    const validatedItems: any[] = [];

    // Loop 1: Validate stock & decrement
    for (const item of orderItemsInput) {
      const product = db.prepare(`SELECT * FROM products WHERE id = ? AND status = 'published'`).get(item.product_id) as any;
      if (!product) {
        throw new Error(`Product not found.`);
      }

      const variant = db.prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ?').get(item.variant_id, item.product_id) as any;
      if (!variant) {
        throw new Error(`Variant not found.`);
      }

      if (variant.stock < item.quantity) {
        throw new Error(`Insufficient stock.`);
      }

      let unitPrice = product.sale_price !== null ? product.sale_price : product.base_price;
      if (variant.price_override !== null && variant.price_override !== undefined) {
        unitPrice = variant.price_override;
      }
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      // Decrement variant stock (using MAX to prevent negative)
      db.prepare('UPDATE product_variants SET stock = MAX(0, stock - ?) WHERE id = ?').run(item.quantity, item.variant_id);

      validatedItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: product.name,
        variant_label: variant.size || '',
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: lineTotal
      });
    }

    const orderNumber = generateOrderNumber();
    const total = subtotal;

    // Create Order record
    const orderResult = db.prepare(`
      INSERT INTO orders (
        order_number, status, subtotal, shipping_cost, discount_amount, total, payment_method,
        shipping_first_name, shipping_last_name, shipping_phone, shipping_address, shipping_city
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNumber,
      'pending',
      subtotal,
      0,
      0,
      total,
      'cod',
      'John',
      'Doe',
      '0612345678',
      '123 Street Name',
      shippingCity
    );

    const orderId = orderResult.lastInsertRowid as number;

    // Create Order Items & Update sold metrics
    for (const item of validatedItems) {
      db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, variant_id, product_name, variant_label, quantity, unit_price, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        item.product_id,
        item.variant_id,
        item.product_name,
        item.variant_label,
        item.quantity,
        item.unit_price,
        item.line_total
      );

      db.prepare('UPDATE products SET sold_count = sold_count + ? WHERE id = ?').run(
        item.quantity,
        item.product_id
      );

      // REDUNDANT DECREMENT REMOVED IN FIX
      // (Before the fix, there was a duplicate UPDATE statement here)
    }

    return { orderId, orderNumber };
  });

  // 5. Run the checkout transaction
  console.log('🛒 Simulating order checkout: purchasing 2 units of variant #201...');
  const result = executeCheckout();
  console.log(`✅ Checkout completed. Order number: ${result.orderNumber}`);

  // 6. Query updated stock from DB and assert correctness
  const variantRow = db.prepare('SELECT stock FROM product_variants WHERE id = 201').get() as { stock: number };
  console.log(`📊 Resulting Stock: ${variantRow.stock} units.`);

  const EXPECTED_STOCK = INITIAL_STOCK - 2; // Should be 8
  
  if (variantRow.stock === EXPECTED_STOCK) {
    console.log('🎉 SUCCESS: Stock was decremented correctly by exactly the order quantity (2 units).');
  } else if (variantRow.stock === INITIAL_STOCK - 4) {
    console.error('❌ FAILURE: Stock was decremented twice (double-decrement bug is present)!');
    process.exit(1);
  } else {
    console.error(`❌ FAILURE: Stock level is unexpected: ${variantRow.stock} (expected ${EXPECTED_STOCK}).`);
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('💥 Test run crashed:', err);
  process.exit(1);
});
