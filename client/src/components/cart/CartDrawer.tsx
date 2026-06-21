import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, Percent, HelpCircle, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/cart.ts';
import { useUIStore } from '../../store/ui.ts';
import { formatPrice } from '../../lib/formatters.ts';
import api from '../../lib/api.ts';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { isCartOpen, setCartOpen } = useUIStore();
  const {
    items,
    promoCode,
    updateQuantity,
    removeItem,
    setPromoCode,
    getSubtotal,
    getBundleDiscount,
    getMinOrderDiscount,
    getShippingCost,
    getDiscountAmount,
    getTotal,
    getFreeShippingProgress,
    addItem
  } = useCartStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isPromoLoading, setIsPromoLoading] = useState(false);
  const [isUpselling, setIsUpselling] = useState(false);

  if (!isCartOpen) return null;

  // Derive cart quantities
  const subtotal = getSubtotal();
  const total = getTotal();
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  // Promo code form handling
  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setIsPromoLoading(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      const response = await api.post('/promo/validate', {
        code: promoInput.trim().toUpperCase(),
        orderTotal: subtotal
      });
      setPromoCode(response.data);
      setPromoSuccess(response.data.message || 'Code promo appliqué !');
    } catch (err: any) {
      setPromoCode(null);
      setPromoError(err.response?.data?.message || 'Erreur lors de la validation du code.');
    } finally {
      setIsPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode(null);
    setPromoInput('');
    setPromoSuccess('');
    setPromoError('');
  };

  // Cross-sell logic: Suggest product B to complete a package
  const getUpsellProduct = () => {
    const slugs = items.map(i => i.product.slug);
    
    // Check if they have the AGV K6 helmet but not the Dainese gloves
    const hasK6 = slugs.find(s => s.startsWith('casque-agv-k6'));
    const hasGants = slugs.find(s => s.startsWith('gants-dainese-carbon-4'));
    if (hasK6 && !hasGants) {
      return {
        triggerSlug: hasK6,
        targetSlug: 'gants-dainese-carbon-4-long-maroc',
        name: 'Gants Dainese Carbon 4 Long',
        image: 'https://picsum.photos/seed/gants-dainese-carbon-4-long-maroc/100/100',
        message: '🔥 Pack Sécurité Route: Ajoutez les gants Dainese Carbon 4 et économisez 10% sur le pack !'
      };
    }

    // Check if they have the Shark helmet but not SMX-6 Boots
    const hasShark = slugs.find(s => s.startsWith('casque-shark-spartan'));
    const hasBoots = slugs.find(s => s.startsWith('bottes-alpinestars-smx-6'));
    if (hasShark && !hasBoots) {
      return {
        triggerSlug: hasShark,
        targetSlug: 'bottes-alpinestars-smx-6-v2-maroc',
        name: 'Bottes Alpinestars SMX-6 v2',
        image: 'https://picsum.photos/seed/bottes-alpinestars-smx-6-v2-maroc/100/100',
        message: '🏁 Pack Aventure: Complétez votre équipement avec les bottes SMX-6 v2 pour économiser 15% !'
      };
    }

    return null;
  };

  const upsell = getUpsellProduct();

  // Add upsell product with 1-click
  const handleAddUpsell = async (targetSlug: string) => {
    if (isUpselling) return;
    setIsUpselling(true);
    try {
      const response = await api.get(`/products/${targetSlug}`);
      const product = response.data;
      // Use the first variant of the upsell product
      const variant = product.variants && product.variants.length > 0 
        ? product.variants[0]
        : { id: 0, product_id: product.id, size: 'Taille Unique', color: 'Standard', sku: 'DEF-SKU', stock: 10 };
      
      addItem(product, variant, 1);
    } catch (err) {
      console.error('Error adding upsell item:', err);
    } finally {
      setIsUpselling(false);
    }
  };

  const handleCheckoutClick = () => {
    setCartOpen(false);
    navigate('/commande');
  };

  const freeShippingProgress = getFreeShippingProgress();
  const amountToFreeShipping = 2000 - subtotal;

  return (
    <div className="fixed inset-0 z-[999] flex justify-end">
      
      {/* Dark overlay backdrop with modern glassmorphism blur */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setCartOpen(false)}
      ></div>

      {/* Main slide-in drawer container */}
      <div className="relative w-full max-w-md bg-white border-l border-gray-200 h-full flex flex-col z-10 shadow-2xl rounded-l-2xl overflow-hidden transition-transform duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-black text-white">
          <div className="flex items-center space-x-2.5">
            <ShoppingBag className="w-5 h-5 text-[#E63012] stroke-[2.5px]" />
            <h2 className="font-display font-black text-sm tracking-widest uppercase">VOTRE PANIER</h2>
            <span className="bg-[#E63012] text-white text-[10px] px-2 py-0.5 rounded font-mono font-black">
              {totalQty}
            </span>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Fermer le panier"
          >
            <X className="w-5 h-5 stroke-[2.5px]" />
          </button>
        </div>

        {/* Free Shipping Progress bar */}
        {totalQty > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 shadow-inner">
            {amountToFreeShipping > 0 ? (
              <p className="text-[11px] text-gray-600 mb-2 font-mono font-bold uppercase tracking-wider">
                Plus que <span className="text-[#E63012] font-black">{Math.ceil(amountToFreeShipping)} DH</span> pour la <span className="text-black font-black">LIVRAISON GRATUITE !</span>
              </p>
            ) : (
              <p className="text-[11px] text-[#22C55E] mb-2 font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                🎉 Vous bénéficiez de la livraison standard GRATUITE !
              </p>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner border border-gray-300/30">
              <div
                className="bg-gradient-to-r from-[#E63012] to-[#FF5C43] h-2 rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${Math.min(freeShippingProgress, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Scrollable list items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              {/* Helmet illustration SVG */}
              <svg
                className="w-20 h-20 mx-auto text-gray-200 stroke-current"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V9a9 9 0 00-18 0v6a2 2 0 002 2z" />
              </svg>
              <h3 className="font-display font-black text-sm text-black uppercase tracking-wider">VOTRE PANIER EST VIDE</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Commencez à explorer nos équipements et accessoires haut de gamme pour équiper votre bécane.
              </p>
              <button
                onClick={() => {
                  setCartOpen(false);
                  navigate('/boutique');
                }}
                className="inline-block mt-4 bg-[#E63012] hover:bg-black text-white px-6 py-3 rounded font-display text-xs font-black uppercase tracking-widest transition-all duration-300 shadow shadow-[#E63012]/10"
              >
                Commencer mes achats
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => {
                let itemPrice = item.product.sale_price !== null ? item.product.sale_price : item.product.base_price;
                if (item.variant && item.variant.price_override !== null && item.variant.price_override !== undefined) {
                  itemPrice = item.variant.price_override;
                }
                return (
                  <div
                    key={item.variant.id}
                    className="flex items-center space-x-4 bg-[#F9FAFB] border border-gray-200 p-3.5 rounded-lg shadow-sm hover:border-gray-300 transition-all duration-300"
                  >
                    <img
                      src={item.product.primary_image || '/placeholder-product.jpg'}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-full bg-white border border-gray-200 flex-shrink-0"
                      onError={(e) => {
                        const t = e.currentTarget;
                        if (!t.src.includes('placeholder')) {
                          t.src = `https://placehold.co/64x64/f3f4f6/9ca3af?text=${encodeURIComponent(item.product.name.slice(0,2))}`;
                        }
                      }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-mono text-[#E63012] font-black uppercase tracking-wider">{item.product.brand_name}</p>
                      <h4 className="text-[13px] font-extrabold text-[#111827] truncate leading-snug uppercase">{item.product.name}</h4>
                      <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">Taille: {item.variant.size || 'Unique'} {item.variant.color ? `| Couleur: ${item.variant.color}` : ''}</p>
                      
                      {/* Quantity Stepper */}
                      <div className="flex items-center space-x-3 mt-3">
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                          className="bg-white border border-gray-300 hover:border-black hover:text-black text-gray-500 w-6 h-6 flex items-center justify-center rounded-sm transition-all focus:outline-none"
                          aria-label="Moins"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5px]" />
                        </button>
                        <span className="text-xs font-mono font-black text-[#111827] w-4 text-center select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                          className="bg-white border border-gray-300 hover:border-black hover:text-black text-gray-500 w-6 h-6 flex items-center justify-center rounded-sm transition-all focus:outline-none"
                          aria-label="Plus"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5px]" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-between h-full space-y-4">
                      <button
                        onClick={() => removeItem(item.variant.id)}
                        className="text-gray-400 hover:text-[#E63012] transition-colors self-end"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="text-[13px] font-mono font-black text-[#111827] block">
                        {formatPrice(itemPrice * item.quantity)}
                      </span>
                    </div>

                  </div>
                );
              })}

              {/* Dynamic Upsell Suggestion Widget */}
              {upsell && (
                <div className="bg-[#E63012]/5 border-2 border-dashed border-[#E63012]/20 rounded-lg p-4 space-y-3.5 mt-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#E63012] text-white text-[8px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-bl shadow-sm">
                    Recommandé
                  </div>
                  <p className="text-[11px] text-black font-black uppercase tracking-wide leading-relaxed flex items-center gap-1.5 pt-1.5">
                    <span>🔥 Offre exclusive panier</span>
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    {upsell.message}
                  </p>
                  <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <img src={upsell.image} alt={upsell.name} className="w-10 h-10 object-cover rounded bg-gray-50 border border-gray-100" />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-black truncate uppercase">{upsell.name}</p>
                        <p className="text-[10px] text-[#22C55E] font-black uppercase tracking-wider mt-0.5">Ajout en 1-clic (-10% de remise)</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddUpsell(upsell.targetSlug)}
                      disabled={isUpselling}
                      className="bg-black hover:bg-[#E63012] text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded transition-all duration-300"
                    >
                      {isUpselling ? 'Ajout...' : '1-Clic'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer checkout area (Visible only when items exist) */}
        {items.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 p-6 space-y-4 shadow-inner">
            
            {/* Calculations breakdown */}
            <div className="space-y-2.5 text-xs pt-1.5">
              <div className="flex justify-between font-medium text-gray-600">
                <span>Sous-total</span>
                <span className="font-mono font-bold text-[#111827]">{formatPrice(subtotal)}</span>
              </div>
              
              {/* Bundle pack savings */}
              {getBundleDiscount() > 0 && (
                <div className="flex justify-between text-[#22C55E] font-bold">
                  <span className="flex items-center">
                    <Percent className="w-3.5 h-3.5 mr-1" /> Remise Pack Combiné
                  </span>
                  <span className="font-mono">-{formatPrice(getBundleDiscount())}</span>
                </div>
              )}

              {/* Volume discount */}
              {getMinOrderDiscount() > 0 && (
                <div className="flex justify-between text-[#22C55E] font-bold">
                  <span className="flex items-center">
                    <Percent className="w-3.5 h-3.5 mr-1" /> Remise Volume (Quantité)
                  </span>
                  <span className="font-mono">-{formatPrice(getMinOrderDiscount())}</span>
                </div>
              )}

              {/* Shipping fees */}
              <div className="flex justify-between font-medium text-gray-600">
                <span>Frais de livraison</span>
                <span className="font-mono font-bold text-gray-800">
                  {getShippingCost() === 0 ? (
                    <span className="text-[#22C55E] font-bold uppercase tracking-wider">Gratuit</span>
                  ) : (
                    formatPrice(getShippingCost())
                  )}
                </span>
              </div>

              {/* Order total */}
              <div className="flex justify-between border-t border-gray-200 pt-3 text-sm font-black text-black">
                <span className="uppercase tracking-wider">TOTAL À PAYER</span>
                <span className="font-mono text-base text-[#E63012]">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={handleCheckoutClick}
              className="w-full bg-[#E63012] hover:bg-black text-white py-4 rounded font-display font-black uppercase tracking-widest text-[11px] flex items-center justify-center space-x-2 transition-all duration-300 shadow-md shadow-[#E63012]/10 hover:shadow-lg hover:shadow-[#E63012]/20 hover:scale-[1.01]"
            >
              <span>CONFIRMER LA COMMANDE</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5px]" />
            </button>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 text-[9px] text-gray-500 text-center font-bold uppercase tracking-wider">
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-[#E63012] mb-1.5" />
                <span>Paiement COD</span>
              </div>
              <div className="flex flex-col items-center">
                <Truck className="w-4 h-4 text-[#E63012] mb-1.5" />
                <span>Livraison 24h</span>
              </div>
              <div className="flex flex-col items-center">
                <HelpCircle className="w-4 h-4 text-[#E63012] mb-1.5" />
                <span>SAV Express</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CartDrawer;
