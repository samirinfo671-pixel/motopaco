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
          newItems[existingIndex].quantity += quantity;
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

        // Bundle 1: Pack Sécurité Route (Casque AGV K6 + Gants Dainese Carbon 4) => 10% Off
        const b1Slugs = ['casque-agv-k6-s-noir-mat-maroc-maroc', 'casque-agv-k6-s-noir-mat-maroc', 'gants-dainese-carbon-4-long-maroc-maroc', 'gants-dainese-carbon-4-long-maroc'];
        // Let's normalize slugs since they might end with -maroc or not
        const actualSlugsInCart = items.map(i => i.product.slug);
        
        const hasK6 = actualSlugsInCart.find(s => s.startsWith('casque-agv-k6'));
        const hasGants = actualSlugsInCart.find(s => s.startsWith('gants-dainese-carbon-4'));

        if (hasK6 && hasGants) {
          const k6Qty = items.find(i => i.product.slug === hasK6)?.quantity || 0;
          const gantsQty = items.find(i => i.product.slug === hasGants)?.quantity || 0;
          const b1Match = Math.min(k6Qty, gantsQty);
          
          if (b1Match > 0) {
            const k6Price = findItemPrice(hasK6);
            const gantsPrice = findItemPrice(hasGants);
            discount += (k6Price + gantsPrice) * b1Match * 0.10;
          }
        }

        // Bundle 2: Pack Aventure (Shark Spartan GT + Alpinestars SMX-6 Boots + Dainese Delta 4 Pants) => 15% Off
        const hasShark = actualSlugsInCart.find(s => s.startsWith('casque-shark-spartan'));
        const hasBoots = actualSlugsInCart.find(s => s.startsWith('bottes-alpinestars-smx-6'));
        const hasPants = actualSlugsInCart.find(s => s.startsWith('pantalon-cuir-dainese-delta'));

        if (hasShark && hasBoots && hasPants) {
          const sharkQty = items.find(i => i.product.slug === hasShark)?.quantity || 0;
          const bootsQty = items.find(i => i.product.slug === hasBoots)?.quantity || 0;
          const pantsQty = items.find(i => i.product.slug === hasPants)?.quantity || 0;
          const b2Match = Math.min(sharkQty, bootsQty, pantsQty);

          if (b2Match > 0) {
            const sharkPrice = findItemPrice(hasShark);
            const bootsPrice = findItemPrice(hasBoots);
            const pantsPrice = findItemPrice(hasPants);
            discount += (sharkPrice + bootsPrice + pantsPrice) * b2Match * 0.15;
          }
        }

        // Bundle 3: Pack Chaîne Complete (DID 525 VX3 + USB charger) => 12% Off
        const hasChain = actualSlugsInCart.find(s => s.startsWith('kit-chaine-did-525'));
        const hasUSB = actualSlugsInCart.find(s => s.startsWith('double-prise-usb'));

        if (hasChain && hasUSB) {
          const chainQty = items.find(i => i.product.slug === hasChain)?.quantity || 0;
          const usbQty = items.find(i => i.product.slug === hasUSB)?.quantity || 0;
          const b3Match = Math.min(chainQty, usbQty);

          if (b3Match > 0) {
            const chainPrice = findItemPrice(hasChain);
            const usbPrice = findItemPrice(hasUSB);
            discount += (chainPrice + usbPrice) * b3Match * 0.12;
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
