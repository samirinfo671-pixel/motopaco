import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Setup email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const isSMTPConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

export async function sendOrderEmails(order: any, items: any[]) {
  const adminEmail = process.env.ADMIN_EMAIL || 'contact@motopaco.com';

  // 1. Build Email Contents
  const orderNumber = order.order_number;
  const buyerName = `${order.shipping_first_name} ${order.shipping_last_name}`;
  const total = order.total.toFixed(2) + ' DH';
  const subtotal = order.subtotal.toFixed(2) + ' DH';
  const shippingCost = order.shipping_cost === 0 ? 'Gratuit' : order.shipping_cost.toFixed(2) + ' DH';
  const discountAmount = order.discount_amount.toFixed(2) + ' DH';
  const address = `${order.shipping_address}, ${order.shipping_city}`;
  const phone = order.shipping_phone;
  const dateString = new Date(order.created_at || Date.now()).toLocaleString('fr-FR');

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.product_name}</strong><br/>
        <span style="font-size: 11px; color: #666;">Taille/Option: ${item.variant_label || 'Unique'}</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.line_total.toFixed(2)} DH</td>
    </tr>
  `).join('');

  // HTML Customer Template
  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #ddd; border-top: 4px solid #E63012; border-radius: 4px; overflow: hidden;">
      <div style="background: #111; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0; font-style: italic; font-weight: 900; letter-spacing: 1px;">MOTO PACO</h2>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">Merci pour votre commande !</p>
      </div>
      <div style="padding: 20px;">
        <p>Bonjour <strong>${buyerName}</strong>,</p>
        <p>Votre commande <strong>#${orderNumber}</strong> a bien été enregistrée et est en cours de traitement. Elle vous sera livrée à l'adresse indiquée ci-dessous.</p>
        
        <h3 style="border-bottom: 1px solid #E63012; padding-bottom: 8px; color: #E63012;">Détails de Livraison</h3>
        <p style="font-size: 13px; line-height: 1.6; margin: 0;">
          <strong>Destinataire:</strong> ${buyerName}<br/>
          <strong>Téléphone:</strong> ${phone}<br/>
          <strong>Adresse:</strong> ${address}<br/>
          <strong>Date:</strong> ${dateString}
        </p>

        <h3 style="border-bottom: 1px solid #E63012; padding-bottom: 8px; color: #E63012; margin-top: 25px;">Résumé Articles</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f9f9f9;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Article</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantité</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right; font-size: 13px;">
          <p style="margin: 5px 0;">Sous-total: <strong>${subtotal}</strong></p>
          ${order.discount_amount > 0 ? `<p style="margin: 5px 0; color: #22C55E;">Remises: <strong>-${discountAmount}</strong></p>` : ''}
          <p style="margin: 5px 0;">Frais de livraison: <strong>${shippingCost}</strong></p>
          <p style="margin: 10px 0 0 0; font-size: 16px; color: #E63012;"><strong>TOTAL À RÉGLER (COD): ${total}</strong></p>
        </div>

        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #22C55E; margin-top: 25px; font-size: 12px; border-radius: 4px;">
          <strong>Paiement à la livraison :</strong> Vous réglerez le montant total de la commande en espèces au livreur lors de la réception de votre colis.
        </div>
      </div>
      <div style="background: #eee; padding: 15px; text-align: center; font-size: 11px; color: #666;">
        MOTO PACO - Lotissement assaada n92, Ain atiq 12000. Pour tout support, contactez-nous au +212 667-389916.
      </div>
    </div>
  `;

  // HTML Admin Template
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #ddd; border-top: 4px solid #111; border-radius: 4px; overflow: hidden;">
      <div style="background: #E63012; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">NOUVELLE COMMANDE REÇUE</h2>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #fff;">Commande #${orderNumber}</p>
      </div>
      <div style="padding: 20px;">
        <p>Une nouvelle commande vient d'être enregistrée sur la boutique :</p>
        
        <h3 style="border-bottom: 1px solid #111; padding-bottom: 8px;">Infos Acheteur</h3>
        <p style="font-size: 13px; line-height: 1.6; margin: 0;">
          <strong>Nom:</strong> ${buyerName}<br/>
          <strong>Tél:</strong> ${phone}<br/>
          <strong>Email:</strong> ${order.shipping_email || 'Non fourni'}<br/>
          <strong>Adresse:</strong> ${address}<br/>
          <strong>Source / UTM:</strong> ${order.source || 'Direct'}
        </p>

        <h3 style="border-bottom: 1px solid #111; padding-bottom: 8px; margin-top: 25px;">Articles</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f9f9f9;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Article</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qté</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right; font-size: 13px;">
          <p style="margin: 5px 0;">Sous-total: <strong>${subtotal}</strong></p>
          <p style="margin: 5px 0;">Livraison: <strong>${shippingCost}</strong></p>
          <p style="margin: 10px 0 0 0; font-size: 16px; color: #E63012;"><strong>TOTAL: ${total}</strong></p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="http://localhost:5173/admin/orders" style="background: #111; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Voir sur le Dashboard Admin</a>
        </div>
      </div>
    </div>
  `;

  // 2. Send Emails
  try {
    const logsDir = path.resolve(process.cwd(), 'emails-log');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
    const emailLogPath = path.join(logsDir, `order-${orderNumber}.html`);
    fs.writeFileSync(emailLogPath, `<!-- CUSTOMER EMAIL -->\n${customerHtml}\n\n<!-- ADMIN EMAIL -->\n${adminHtml}`);

    console.log(`[MAILER] Order #${orderNumber} emails saved locally to: ${emailLogPath}`);

    if (isSMTPConfigured) {
      // Send to Admin
      await transporter.sendMail({
        from: `"MOTO PACO Store" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `[Nouvelle Commande] #${orderNumber} - ${buyerName} (${total})`,
        html: adminHtml,
      });
      console.log(`[MAILER] Admin alert email sent successfully to ${adminEmail}`);

      // Send to Customer
      if (order.shipping_email) {
        await transporter.sendMail({
          from: `"MOTO PACO" <${process.env.SMTP_USER}>`,
          to: order.shipping_email,
          subject: `Votre commande MOTO PACO #${orderNumber} est validée !`,
          html: customerHtml,
        });
        console.log(`[MAILER] Customer confirmation email sent successfully to ${order.shipping_email}`);
      }
    } else {
      console.log(`[MAILER] SMTP credentials not fully configured. Email sending simulated (logs written).`);
    }
  } catch (err) {
    console.error('[MAILER] Error during email routine:', err);
  }
}
