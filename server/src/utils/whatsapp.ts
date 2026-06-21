import fs from 'fs';
import path from 'path';

export async function sendWhatsAppAlert(order: any, items: any[]) {
  const whatsappNumber = process.env.WHATSAPP_NUMBER || '212667389916'; // Business whatsapp number

  const orderNumber = order.order_number;
  const buyerName = `${order.shipping_first_name} ${order.shipping_last_name}`;
  const total = order.total.toFixed(2) + ' DH';
  const subtotal = order.subtotal.toFixed(2) + ' DH';
  const shippingCost = order.shipping_cost === 0 ? 'Gratuit' : order.shipping_cost.toFixed(2) + ' DH';
  const address = `${order.shipping_address}, ${order.shipping_city}`;
  const phone = order.shipping_phone;

  const itemsList = items.map(item => `- ${item.product_name} (Taille/Option: ${item.variant_label || 'Unique'}) x${item.quantity} : ${item.line_total.toFixed(2)} DH`).join('\n');

  const messageText = `🏍️ *NOUVELLE COMMANDE - MOTO PACO* 🏍️\n\n` +
    `*Commande :* #${orderNumber}\n` +
    `*Client :* ${buyerName}\n` +
    `*Tél :* ${phone}\n` +
    `*Adresse :* ${address}\n\n` +
    `*Articles :*\n${itemsList}\n\n` +
    `*Sous-total :* ${subtotal}\n` +
    `*Frais de livraison :* ${shippingCost}\n` +
    `*TOTAL À RÉGLER :* ${total}\n\n` +
    `*Mode de Paiement :* Cash à la livraison (COD)`;

  try {
    const logsDir = path.resolve(process.cwd(), 'whatsapp-log');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
    const logPath = path.join(logsDir, `order-${orderNumber}.txt`);
    fs.writeFileSync(logPath, `TO: ${whatsappNumber}\n\n${messageText}`);

    console.log(`[WHATSAPP] Order #${orderNumber} notification saved locally to: ${logPath}`);

    // If a webhook is configured, call it
    if (process.env.WHATSAPP_WEBHOOK) {
      try {
        await fetch(process.env.WHATSAPP_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: whatsappNumber,
            message: messageText
          })
        });
        console.log(`[WHATSAPP] Webhook triggered successfully.`);
      } catch (webhookErr) {
        console.error(`[WHATSAPP] Failed to trigger webhook:`, webhookErr);
      }
    }
  } catch (err) {
    console.error('[WHATSAPP] Error during WhatsApp logging routine:', err);
  }
}
