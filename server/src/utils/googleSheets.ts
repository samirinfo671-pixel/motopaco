import db from '../db/database.ts';

export async function syncOrderToGoogleSheets(order: any, items: any[]) {
  try {
    // Retrieve the Google Sheets Webhook URL from site settings
    const row = db.prepare("SELECT value FROM site_settings WHERE key = 'google_sheets_webhook_url'").get() as { value: string } | undefined;
    const webhookUrl = row?.value;
    
    if (!webhookUrl || !webhookUrl.trim()) {
      return; // No webhook configured, skip sync
    }
    
    const payload = {
      order_number: order.order_number,
      created_at: order.created_at || new Date().toISOString(),
      status: order.status || 'pending',
      client_name: `${order.shipping_first_name} ${order.shipping_last_name}`.trim(),
      phone: order.shipping_phone,
      email: order.shipping_email || '',
      city: order.shipping_city,
      address: order.shipping_address,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      discount_amount: order.discount_amount,
      total: order.total,
      notes: order.notes,
      source: order.source,
      items: items.map(item => ({
        product_name: item.product_name,
        variant_label: item.variant_label,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total
      }))
    };
    
    console.log(`[Google Sheets] Syncing order ${order.order_number} to Webhook URL...`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    
    console.log(`[Google Sheets] Order ${order.order_number} successfully synced.`);
  } catch (error) {
    console.error(`[Google Sheets] Failed to sync order ${order.order_number}:`, error);
  }
}
