// MOTO PACO Tracking Pixel Manager
// Configured to initialize and trigger events for Facebook/Meta Pixel, Google Tag Manager (GA4), TikTok, and Snapchat.



// Initialize pixels on application load
export function initPixels(config?: { meta?: string, gtm?: string, snap?: string, tiktok?: string }) {
  if (typeof window === 'undefined') return;

  const w = window as any;
  const META_PIXEL_ID = config?.meta || import.meta.env.VITE_META_PIXEL_ID;
  const GTM_ID = config?.gtm || import.meta.env.VITE_GTM_ID;
  const SNAP_PIXEL_ID = config?.snap || import.meta.env.VITE_SNAP_PIXEL_ID;
  const TIKTOK_PIXEL_ID = config?.tiktok || import.meta.env.VITE_TIKTOK_PIXEL_ID;

  console.log(`[PIXELS] Initializing Meta: ${META_PIXEL_ID}, TikTok: ${TIKTOK_PIXEL_ID}, Snapchat: ${SNAP_PIXEL_ID}, GTM: ${GTM_ID}`);

  // 1. Meta / Facebook Pixel
  if (META_PIXEL_ID && typeof META_PIXEL_ID === 'string' && META_PIXEL_ID.trim() !== '') {
    if (!w.fbq) {
      w.fbq = function(...args: any[]) {
        if (w.fbq.callMethod) {
          w.fbq.callMethod.apply(w.fbq, args);
        } else {
          w.fbq.queue.push(args);
        }
      };
      w.fbq.push = w.fbq;
      w.fbq.loaded = true;
      w.fbq.version = '2.0';
      w.fbq.queue = [];

      const t = document.createElement('script');
      t.async = true;
      t.src = 'https://connect.facebook.net/en_US/fbevents.js';
      const s = document.getElementsByTagName('script')[0];
      if (s && s.parentNode) {
        s.parentNode.insertBefore(t, s);
      } else {
        document.head.appendChild(t);
      }
    }
    
    // Track initialized pixels to avoid duplicate 'init' calls
    w.fbq.initializedPixels = w.fbq.initializedPixels || [];
    if (!w.fbq.initializedPixels.includes(META_PIXEL_ID)) {
      w.fbq('init', META_PIXEL_ID);
      w.fbq('track', 'PageView');
      w.fbq.initializedPixels.push(META_PIXEL_ID);
    }
  }

  // 2. TikTok Pixel Mock
  if (!w.ttq) {
    w.ttq = [];
    w.ttq.methods = ["track", "once", "screen", "user", "identify", "set", "name", "setClientId", "setDeveloperId", "setTargetClientId", "setSessionId", "setAdmengId", "setAdId", "setCreativeId", "setCampaignId", "setLogExtra", "setUserId", "setProperties", "setExternalId", "setPixelId"];
    w.ttq.setPixelId = function() {};
    console.log('[PIXELS] TikTok Pixel loaded in mock-mode.');
  }

  // 3. Snapchat Pixel
  if (SNAP_PIXEL_ID && typeof SNAP_PIXEL_ID === 'string' && SNAP_PIXEL_ID.trim() !== '') {
    if (!w.snaptr) {
      w.snaptr = function(...args: any[]) {
        if (w.snaptr.handleRequest) {
          w.snaptr.handleRequest.apply(w.snaptr, args);
        } else {
          w.snaptr.queue.push(args);
        }
      };
      w.snaptr.queue = [];

      const a = document.createElement('script');
      a.async = true;
      a.src = 'https://sc-static.net/sce/pixel/snaptr.js';
      const s = document.getElementsByTagName('script')[0];
      if (s && s.parentNode) {
        s.parentNode.insertBefore(a, s);
      } else {
        document.head.appendChild(a);
      }
    }

    w.snaptr.initializedPixels = w.snaptr.initializedPixels || [];
    if (!w.snaptr.initializedPixels.includes(SNAP_PIXEL_ID)) {
      w.snaptr('init', SNAP_PIXEL_ID);
      w.snaptr('track', 'PAGE_VIEW');
      w.snaptr.initializedPixels.push(SNAP_PIXEL_ID);
    }
  }

  // 4. Google Tag Manager
  if (GTM_ID && typeof GTM_ID === 'string' && GTM_ID.trim() !== '') {
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    const gtmScriptExists = document.querySelector(`script[src*="gtm.js?id=${GTM_ID}"]`);
    if (!gtmScriptExists) {
      const f = document.getElementsByTagName('script')[0];
      const j = document.createElement('script');
      j.async = true;
      j.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
      if (f && f.parentNode) {
        f.parentNode.insertBefore(j, f);
      } else {
        document.head.appendChild(j);
      }
    }
  }
}

// Track Page View
export function trackPageView(url: string) {
  console.log(`[TRACKING] PageView: ${url}`);
  const w = window as any;
  
  if (w.fbq) w.fbq('track', 'PageView');
  if (w.snaptr) w.snaptr('track', 'PAGE_VIEW');
  if (w.dataLayer) {
    w.dataLayer.push({
      event: 'pageview',
      page_path: url
    });
  }
}

// Track View Content (Product details page viewed)
export function trackViewContent(product: { id: number; name: string; price: number; category?: string }) {
  console.log(`[TRACKING] ViewContent: ${product.name} (${product.price} DH)`);
  const w = window as any;

  if (w.fbq) {
    w.fbq('track', 'ViewContent', {
      content_ids: [product.id.toString()],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'MAD'
    });
  }

  if (w.snaptr) {
    w.snaptr('track', 'VIEW_CONTENT', {
      item_ids: [product.id.toString()],
      price: product.price,
      currency: 'MAD'
    });
  }

  if (w.dataLayer) {
    w.dataLayer.push({
      event: 'view_item',
      ecommerce: {
        currency: 'MAD',
        value: product.price,
        items: [{
          item_id: product.id.toString(),
          item_name: product.name,
          price: product.price,
          item_category: product.category || ''
        }]
      }
    });
  }
}

// Track Add To Cart
export function trackAddToCart(product: { id: number; name: string; price: number }, quantity: number) {
  console.log(`[TRACKING] AddToCart: ${product.name} x${quantity}`);
  const w = window as any;

  if (w.fbq) {
    w.fbq('track', 'AddToCart', {
      content_ids: [product.id.toString()],
      content_name: product.name,
      content_type: 'product',
      value: product.price * quantity,
      currency: 'MAD'
    });
  }

  if (w.snaptr) {
    w.snaptr('track', 'ADD_CART', {
      item_ids: [product.id.toString()],
      price: product.price * quantity,
      currency: 'MAD'
    });
  }

  if (w.dataLayer) {
    w.dataLayer.push({
      event: 'add_to_cart',
      ecommerce: {
        currency: 'MAD',
        value: product.price * quantity,
        items: [{
          item_id: product.id.toString(),
          item_name: product.name,
          price: product.price,
          quantity: quantity
        }]
      }
    });
  }
}

// Track Initiate Checkout
export function trackInitiateCheckout(total: number, itemCount: number) {
  console.log(`[TRACKING] InitiateCheckout: Total: ${total} DH, Items: ${itemCount}`);
  const w = window as any;

  if (w.fbq) {
    w.fbq('track', 'InitiateCheckout', {
      value: total,
      currency: 'MAD',
      num_items: itemCount
    });
  }

  if (w.snaptr) {
    w.snaptr('track', 'START_CHECKOUT', {
      price: total,
      currency: 'MAD'
    });
  }

  if (w.dataLayer) {
    w.dataLayer.push({
      event: 'begin_checkout',
      ecommerce: {
        currency: 'MAD',
        value: total
      }
    });
  }
}

// Track Purchase / Complete Payment
export function trackPurchase(order: { order_number: string; total: number; items: any[] }) {
  console.log(`[TRACKING] Purchase: Order #${order.order_number}, Total: ${order.total} DH`);
  const w = window as any;

  // Safe item normalization to handle both CartItem format (e.g. { product, variant, quantity })
  // and Database OrderItem format (e.g. { product_id, product_name, unit_price, quantity })
  const normalizedItems = (order.items || []).map(item => {
    if (item && item.product) {
      const price = item.variant?.price_override ?? item.product.sale_price ?? item.product.base_price ?? 0;
      return {
        product_id: item.product.id,
        product_name: item.product.name,
        unit_price: price,
        quantity: item.quantity || 1
      };
    }
    return {
      product_id: item?.product_id || item?.id || 0,
      product_name: item?.product_name || item?.name || 'Produit',
      unit_price: item?.unit_price || item?.price || 0,
      quantity: item?.quantity || 1
    };
  });

  if (w.fbq) {
    w.fbq('track', 'Purchase', {
      content_ids: normalizedItems.map(item => item.product_id.toString()),
      content_type: 'product',
      value: order.total,
      currency: 'MAD',
      order_id: order.order_number
    });
  }

  if (w.snaptr) {
    w.snaptr('track', 'PURCHASE', {
      transaction_id: order.order_number,
      price: order.total,
      currency: 'MAD'
    });
  }

  if (w.dataLayer) {
    w.dataLayer.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: order.order_number,
        value: order.total,
        currency: 'MAD',
        items: normalizedItems.map(item => ({
          item_id: item.product_id.toString(),
          item_name: item.product_name,
          price: item.unit_price,
          quantity: item.quantity
        }))
      }
    });
  }
}
