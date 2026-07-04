import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, ProductVariant, PromoCode } from '../types/product.ts';
import { trackAddToCart } from '../lib/pixels.ts';

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  promoCode: PromoCode | null;
  deliveryMethod: 'standard' | 'express' | 'retrait';
  shippingCity: string;
  shippingRates: Record<string, number>;
  
  addItem: (product: Product, variant: ProductVariant, quantity: number) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  setPromoCode: (promo: PromoCode | null) => void;
  setDeliveryMethod: (method: 'standard' | 'express' | 'retrait') => void;
  setShippingCity: (city: string) => void;
  setShippingRates: (rates: Record<string, number>) => void;
  
  getSubtotal: () => number;
  getBundleDiscount: () => number;
  getMinOrderDiscount: () => number;
  getShippingCost: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getFreeShippingProgress: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      deliveryMethod: 'standard',
      shippingCity: 'Casablanca',
      shippingRates: {},

      addItem: (product, variant, quantity) => {
        const items = get().items;
        const existingIndex = items.findIndex(item => item.variant.id === variant.id);

        let newItems = [...items];
        if (existingIndex > -1) {
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity
          };
        } else {
          newItems.push({ product, variant, quantity });
        }

        set({ items: newItems });
        trackAddToCart({ id: product.id, name: product.name, price: product.sale_price ?? product.base_price }, quantity);
      },

      removeItem: (variantId) => {
        const newItems = get().items.filter(item => item.variant.id !== variantId);
        set({ items: newItems });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        const newItems = get().items.map(item => 
          item.variant.id === variantId ? { ...item, quantity } : item
        );
        set({ items: newItems });
      },

      clearCart: () => {
        set({ items: [], promoCode: null, deliveryMethod: 'standard', shippingCity: 'Casablanca' });
      },

      setPromoCode: (promo) => {
        set({ promoCode: promo });
      },

      setDeliveryMethod: (method) => {
        set({ deliveryMethod: method });
      },

      setShippingCity: (city) => {
        set({ shippingCity: city });
      },

      setShippingRates: (rates) => {
        set({ shippingRates: rates });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          let price = item.product.sale_price !== null ? item.product.sale_price : item.product.base_price;
          if (item.variant && item.variant.price_override !== null && item.variant.price_override !== undefined) {
            price = item.variant.price_override;
          }
          return sum + price * item.quantity;
        }, 0);
      },

      getBundleDiscount: () => {
        const items = get().items;
        let discount = 0;

        const findItemPrice = (slug: string) => {
          const it = items.find(item => item.product.slug === slug);
          if (!it) return 0;
          let p = it.product.sale_price !== null ? it.product.sale_price : it.product.base_price;
          if (it.variant && it.variant.price_override !== null && it.variant.price_override !== undefined) {
            p = it.variant.price_override;
          }
          return p;
        };

        const getMatchQty = (slugs: string[]) => {
          const qtys = slugs.map(slug => {
            const it = items.find(item => item.product.slug === slug);
            return it ? it.quantity : 0;
          });
          return Math.min(...qtys);
        };

        // Bundle 1: Pack Sécurité Route (Casque AGV + Gants Dainese/Alpinestars) => 10% Off
        const actualSlugsInCart = items.map(i => i.product.slug);
        
        const hasAGV = actualSlugsInCart.find(s => s.includes('agv'));
        const hasGants = actualSlugsInCart.find(s => (s.includes('gant') || s.includes('glove')) && (s.includes('dainese') || s.includes('alpinestars')));

        if (hasAGV && hasGants) {
          const agvQty = items.find(i => i.product.slug === hasAGV)?.quantity || 0;
          const gantsQty = items.find(i => i.product.slug === hasGants)?.quantity || 0;
          const b1Match = Math.min(agvQty, gantsQty);
          
          if (b1Match > 0) {
            const agvPrice = findItemPrice(hasAGV);
            const gantsPrice = findItemPrice(hasGants);
            discount += (agvPrice + gantsPrice) * b1Match * 0.10;
          }
        }

        // Bundle 2: Pack Aventure (Casque Shark + Bottes Dainese/TCX) => 15% Off
        const hasShark = actualSlugsInCart.find(s => s.includes('shark'));
        const hasBoots = actualSlugsInCart.find(s => s.includes('botte') || s.includes('boot') || s.includes('chaussure') || s.includes('shoes'));

        if (hasShark && hasBoots) {
          const sharkQty = items.find(i => i.product.slug === hasShark)?.quantity || 0;
          const bootsQty = items.find(i => i.product.slug === hasBoots)?.quantity || 0;
          const b2Match = Math.min(sharkQty, bootsQty);

          if (b2Match > 0) {
            const sharkPrice = findItemPrice(hasShark);
            const bootsPrice = findItemPrice(hasBoots);
            discount += (sharkPrice + bootsPrice) * b2Match * 0.15;
          }
        }

        // Bundle 3: Pack Smartphone Connecté (Support Smartphone / Quad Lock + USB charger) => 12% Off
        const hasSupport = actualSlugsInCart.find(s => s.includes('support-smartphone') || s.includes('support-telephone') || s.includes('quad-lock') || s.includes('support-pour-telephone-portable'));
        const hasUSB = actualSlugsInCart.find(s => s.includes('usb') || s.includes('chargeur') || s.includes('prise-electrique'));

        if (hasSupport && hasUSB) {
          const supportQty = items.find(i => i.product.slug === hasSupport)?.quantity || 0;
          const usbQty = items.find(i => i.product.slug === hasUSB)?.quantity || 0;
          const b3Match = Math.min(supportQty, usbQty);

          if (b3Match > 0) {
            const supportPrice = findItemPrice(hasSupport);
            const usbPrice = findItemPrice(hasUSB);
            discount += (supportPrice + usbPrice) * b3Match * 0.12;
          }
        }

        return Math.round(discount * 100) / 100;
      },

      getMinOrderDiscount: () => {
        const subtotal = get().getSubtotal();
        const bundleDiscount = get().getBundleDiscount();
        const remainder = subtotal - bundleDiscount;
        const totalQty = get().items.reduce((sum, item) => sum + item.quantity, 0);

        if (totalQty >= 3) {
          return Math.round(remainder * 0.10 * 100) / 100; // 10% off for 3+ items
        } else if (totalQty >= 2) {
          return Math.round(remainder * 0.05 * 100) / 100; // 5% off for 2 items
        }
        return 0;
      },

      getShippingCost: () => {
        const method = get().deliveryMethod;
        const subtotal = get().getSubtotal();

        if (method === 'retrait') return 0;
        if (method === 'express') return 80;
        
        // Standard delivery is free above 2000 DH
        if (subtotal >= 2000) return 0;

        const city = get().shippingCity;
        const rates = get().shippingRates;
        return rates[city] ?? 40; // default to 40 DH if not found
      },

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const bundleDiscount = get().getBundleDiscount();
        const minOrderDiscount = get().getMinOrderDiscount();
        let totalDiscount = bundleDiscount + minOrderDiscount;

        const promo = get().promoCode;
        if (promo) {
          const remainder = subtotal - totalDiscount;
          if (promo.discount_type === 'percent') {
            totalDiscount += remainder * (promo.discount_value / 100);
          } else if (promo.discount_type === 'fixed') {
            totalDiscount += promo.discount_value;
          }
        }

        return Math.round(totalDiscount * 100) / 100;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const shipping = get().getShippingCost();
        return Math.max(0, subtotal - discount + shipping);
      },

      getFreeShippingProgress: () => {
        const subtotal = get().getSubtotal();
        return Math.min((subtotal / 2000) * 100, 100);
      }
    }),
    {
      name: 'packmoto-cart-storage',
      partialize: (state) => ({
        items: state.items,
        promoCode: state.promoCode,
        deliveryMethod: state.deliveryMethod,
        shippingCity: state.shippingCity
      })
    }
  )
);
