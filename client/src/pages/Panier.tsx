import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, HelpCircle } from 'lucide-react';
import { useCartStore } from '../store/cart.ts';
import { formatPrice } from '../lib/formatters.ts';
import { ProductImg } from '../components/product/ProductImg.tsx';

export const Panier: React.FC = () => {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getBundleDiscount = useCartStore((state) => state.getBundleDiscount);
  const getMinOrderDiscount = useCartStore((state) => state.getMinOrderDiscount);
  const getShippingCost = useCartStore((state) => state.getShippingCost);
  const getDiscountAmount = useCartStore((state) => state.getDiscountAmount);
  const getTotal = useCartStore((state) => state.getTotal);
  const getFreeShippingProgress = useCartStore((state) => state.getFreeShippingProgress);

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const shipping = getShippingCost();
  const total = getTotal();
  const cartQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] pt-32 pb-16 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded p-8 sm:p-12 space-y-6 shadow-2xl">
          <ShoppingBag className="w-16 h-16 mx-auto text-[#E5E7EB]" />
          <h1 className="font-display font-black text-2xl text-[#111827]">VOTRE PANIER EST VIDE</h1>
          <p className="text-sm text-[#4B5563]">
            Vous n'avez pas encore d'équipements de moto dans votre panier.
          </p>
          <Link
            to="/boutique"
            className="w-full bg-[#E63012] hover:bg-[#111827] text-white py-4 rounded font-display font-bold uppercase tracking-wider text-xs inline-block text-center transition-colors"
          >
            COMMENCER MES ACHATS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-28 pb-16 text-[#111827]">
      <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="race-livery text-3xl sm:text-5xl text-[#111827] mb-8">
          VOTRE PANIER
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart items list */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded overflow-hidden">
              <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] hidden md:grid grid-cols-12 text-xs font-mono font-bold text-[#4B5563] uppercase tracking-wider">
                <div className="col-span-6">Produit</div>
                <div className="col-span-2 text-center">Quantité</div>
                <div className="col-span-2 text-right">Prix Unitaire</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              <div className="divide-y divide-[#E5E7EB]">
                {items.map((item) => {
                  let unitPrice = item.product.sale_price !== null ? item.product.sale_price : item.product.base_price;
                  if (item.variant && item.variant.price_override !== null && item.variant.price_override !== undefined) {
                    unitPrice = item.variant.price_override;
                  }
                  return (
                    <div key={item.variant.id} className="p-4 md:grid grid-cols-12 items-center gap-4">
                      {/* Product details */}
                      <div className="col-span-12 md:col-span-6 flex items-center space-x-4">
                        <ProductImg
                          src={item.product.primary_image}
                          alt={item.product.name}
                          fallbackText={item.product.name}
                          loading="lazy"
                          className="w-16 h-16 object-cover rounded bg-[#F9FAFB] border border-[#E5E7EB]"
                        />
                        <div className="min-w-0">
                          <p className="text-[9px] font-mono text-[#E63012] font-black uppercase leading-none">{item.product.brand_name}</p>
                          <Link to={`/produit/${item.product.slug}`} className="text-sm font-bold text-[#111827] hover:text-[#E63012] transition-colors leading-snug mt-1 inline-block truncate max-w-xs sm:max-w-md">
                            {item.product.name}
                          </Link>
                          <p className="text-[10px] text-[#4B5563] font-bold uppercase mt-1">Taille: {item.variant.size || 'Unique'} {item.variant.color ? `| Couleur: ${item.variant.color}` : ''}</p>
                        </div>
                      </div>

                      {/* Quantity selector */}
                      <div className="col-span-6 md:col-span-2 flex justify-center items-center mt-4 md:mt-0">
                        <div className="flex items-center space-x-2 bg-[#F9FAFB] border border-[#E5E7EB] px-2 py-1 rounded">
                          <button
                            onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                            className="text-[#4B5563] hover:text-white transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-mono font-bold text-[#111827] w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                            className="text-[#4B5563] hover:text-white transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Unit price */}
                      <div className="col-span-3 md:col-span-2 text-right font-mono text-xs sm:text-sm font-bold text-[#4B5563] mt-4 md:mt-0">
                        <span className="md:hidden mr-1">Unit:</span>
                        {formatPrice(unitPrice)}
                      </div>

                      {/* Line total price */}
                      <div className="col-span-3 md:col-span-2 text-right flex items-center justify-end space-x-3 mt-4 md:mt-0">
                        <span className="font-mono text-xs sm:text-sm font-bold text-[#111827]">
                          {formatPrice(unitPrice * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.variant.id)}
                          className="text-[#4B5563] hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Checkout sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 space-y-4">
              <h2 className="font-display font-extrabold text-sm uppercase text-[#111827] tracking-wider border-b border-[#E5E7EB] pb-2">Résumé de la commande</h2>
              
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-mono font-bold text-[#111827]">{formatPrice(subtotal)}</span>
                </div>

                {getBundleDiscount() > 0 && (
                  <div className="flex justify-between text-[#22C55E] font-medium">
                    <span>Remise Pack</span>
                    <span className="font-mono font-bold">-{formatPrice(getBundleDiscount())}</span>
                  </div>
                )}

                {getMinOrderDiscount() > 0 && (
                  <div className="flex justify-between text-[#22C55E] font-medium">
                    <span>Remise Volume</span>
                    <span className="font-mono font-bold">-{formatPrice(getMinOrderDiscount())}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span className="font-mono font-bold text-[#111827]">
                    {shipping === 0 ? 'Gratuit' : formatPrice(shipping)}
                  </span>
                </div>

                <div className="flex justify-between border-t border-[#E5E7EB] pt-4 text-sm sm:text-base font-bold text-[#111827]">
                  <span>TOTAL DE LA COMMANDE</span>
                  <span className="font-mono text-sm sm:text-base text-[#E63012]">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => navigate('/commande')}
                className="w-full bg-[#E63012] hover:bg-[#111827] text-white py-4 rounded font-display font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-2 transition-all shadow red-glow"
              >
                <span>PASSER LA COMMANDE</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Guarantees */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#E5E7EB] text-[9px] text-[#4B5563] text-center">
                <div className="flex flex-col items-center">
                  <ShieldCheck className="w-4 h-4 text-[#E63012] mb-1" />
                  <span>Paiement Cash</span>
                </div>
                <div className="flex flex-col items-center">
                  <Truck className="w-4 h-4 text-[#E63012] mb-1" />
                  <span>Livraison 24-48h</span>
                </div>
                <div className="flex flex-col items-center">
                  <HelpCircle className="w-4 h-4 text-[#E63012] mb-1" />
                  <span>Support WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Panier;
