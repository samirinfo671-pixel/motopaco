import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, ShieldCheck, MapPin, Phone, Mail, User, Info, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/cart.ts';
import { useAuthStore } from '../store/auth.ts';
import { formatPrice } from '../lib/formatters.ts';
import { trackInitiateCheckout, trackPurchase } from '../lib/pixels.ts';
import api from '../lib/api.ts';
import SEOHead from '../components/seo/SEOHead.tsx';

// 30 Moroccan cities dropdown list
const MOROCCAN_CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 
  'Tétouan', 'Salé', 'Nador', 'Berrechid', 'Khémisset', 'Beni Mellal', 'El Jadida', 'Safi', 
  'Mohammedia', 'Khouribga', 'El Kelaa des Sraghna', 'Taroudant', 'Ouarzazate', 'Dakhla', 
  'Laâyoune', 'Al Hoceima', 'Taza', 'Berkane', 'Settat', 'Taourirt', 'Errachidia'
].sort();

export const Commande: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    items,
    promoCode,
    deliveryMethod,
    setDeliveryMethod,
    shippingCity,
    setShippingCity,
    setShippingRates,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    getShippingCost,
    clearCart
  } = useCartStore();

  // Shipping Form State
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(shippingCity || 'Casablanca');
  const [zipCode, setZipCode] = useState('');
  const [notes, setNotes] = useState('');

  // Load custom shipping rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await api.get('/settings/shipping-rates');
        setShippingRates(res.data);
      } catch (err) {
        console.error('Failed to load shipping rates:', err);
      }
    };
    fetchRates();
  }, [setShippingRates]);

  // Sync city state with store value if it updates
  useEffect(() => {
    if (shippingCity) {
      setCity(shippingCity);
    }
  }, [shippingCity]);

  // Checkout flow state
  const [paymentMethod] = useState<'cod'>('cod');
  
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const shipping = getShippingCost();
  const total = getTotal();

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/panier');
    } else {
      // Trigger Initiate Checkout Pixel event
      trackInitiateCheckout(total, items.length);
    }
  }, [items, navigate]);

  // If the active delivery method is express (from a previous session), fallback to standard
  useEffect(() => {
    if (deliveryMethod === 'express') {
      setDeliveryMethod('standard');
    }
  }, [deliveryMethod, setDeliveryMethod]);

  // Adjust shipping costs dynamically when delivery method changes
  const handleDeliveryChange = (method: 'standard' | 'retrait') => {
    setDeliveryMethod(method as any);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Field Validations
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !address.trim() || !city) {
      setValidationError('Veuillez remplir tous les champs de livraison obligatoires.');
      return;
    }

    // Phone format check: Moroccan standard 06/07 or +212
    const phoneRegex = /^(?:\+212|0)[67]\d{8}$/;
    if (!phoneRegex.test(phone.trim().replace(/\s+/g, ''))) {
      setValidationError('Numéro de téléphone invalide. Utilisez un format marocain (ex: 0612345678 ou +212612345678).');
      return;
    }



    setIsSubmitting(true);

    try {
      const orderData = {
        user_id: user?.id || null,
        shipping_first_name: firstName.trim(),
        shipping_last_name: lastName.trim(),
        shipping_phone: phone.trim().replace(/\s+/g, ''),
        shipping_email: email.trim(),
        shipping_address: address.trim(),
        shipping_city: city,
        shipping_zip: zipCode.trim(),
        delivery_method: deliveryMethod,
        payment_method: paymentMethod,
        promo_code: promoCode?.code || null,
        items: items.map(i => ({
          product_id: i.product.id,
          variant_id: i.variant.id,
          quantity: i.quantity
        })),
        notes: notes.trim(),
        source: localStorage.getItem('packmoto_source') || 'Direct'
      };

      const response = await api.post('/orders', orderData);
      const { order } = response.data;

      // Trigger Purchase pixel event
      trackPurchase({
        order_number: order.order_number,
        total: order.total,
        items: items
      });

      // Auto-open WhatsApp with the detailed pre-filled order receipt
      try {
        const itemsListText = items.map(i => {
          let p = i.product.sale_price ?? i.product.base_price;
          if (i.variant && i.variant.price_override !== null && i.variant.price_override !== undefined) p = i.variant.price_override;
          return `- ${i.product.name} (Taille: ${i.variant.size || 'Unique'}) x${i.quantity} : ${formatPrice(p * i.quantity)}`;
        }).join('\n');
        
        const messageText = `Bonjour MOTO PACO, voici les détails de ma commande #${order.order_number} :\n\n` +
          `Nom: ${firstName} ${lastName}\n` +
          `Tél: ${orderData.shipping_phone}\n` +
          `Adresse: ${address}, ${city}\n\n` +
          `Articles:\n${itemsListText}\n\n` +
          `Sous-total: ${formatPrice(subtotal)}\n` +
          `Frais de livraison: ${order.shipping_cost === 0 ? 'Gratuit' : formatPrice(order.shipping_cost)}\n` +
          `Total: ${formatPrice(order.total)}\n` +
          `Mode de Paiement: Paiement à la livraison`;

        const waUrl = `https://wa.me/212667389916?text=${encodeURIComponent(messageText)}`;
        window.open(waUrl, '_blank');
      } catch (e) {
        console.error('Failed to open WhatsApp window:', e);
      }

      // Clear shopping cart
      clearCart();

      // Route to confirmation screen
      navigate(`/confirmation?orderNumber=${order.order_number}&phone=${encodeURIComponent(orderData.shipping_phone)}`);

    } catch (err: any) {
      setValidationError(err.response?.data?.message || 'Erreur lors de la confirmation de votre commande. Veuillez vérifier vos stocks.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-28 pb-16 text-[#111827]">
      <SEOHead
        title="Finaliser ma commande | MOTO PACO"
        description="Remplissez vos coordonnées de livraison pour valider votre commande. Paiement Cash à la livraison partout au Maroc."
      />

      <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Checkout Steps Form */}
          <div className="lg:col-span-8 space-y-6">
            <h1 className="race-livery text-2xl sm:text-4xl text-[#111827] tracking-wide mb-2">
              FINALISER VOTRE COMMANDE
            </h1>
            
            {validationError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded text-xs font-bold flex items-center space-x-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
              
              {/* Step 1: Delivery information */}
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 space-y-4">
                <div className="flex items-center space-x-2 border-b border-[#E5E7EB] pb-3 mb-2">
                  <MapPin className="w-5 h-5 text-[#E63012]" />
                  <h2 className="font-display font-black italic text-base text-[#111827] uppercase tracking-wider">1. Informations de Livraison</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#4B5563] uppercase">Prénom <span className="text-[#E63012]">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-[#4B5563]" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded pl-10 pr-4 py-3 text-sm text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#4B5563] uppercase">Nom <span className="text-[#E63012]">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-[#4B5563]" />
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded pl-10 pr-4 py-3 text-sm text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#4B5563] uppercase">Téléphone WhatsApp <span className="text-[#E63012]">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-4 h-4 text-[#4B5563]" />
                      <input
                        type="tel"
                        required
                        placeholder="Ex: 0612345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded pl-10 pr-4 py-3 text-sm text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#4B5563] uppercase">Email (Optionnel)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-[#4B5563]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded pl-10 pr-4 py-3 text-sm text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#4B5563] uppercase">Adresse Postale <span className="text-[#E63012]">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="N° de rue, Résidence, Appartement..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-[#F9FAFB] border border-[#E5E7EB] rounded px-4 py-3 text-sm text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#4B5563] uppercase">Ville <span className="text-[#E63012]">*</span></label>
                    <select
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setShippingCity(e.target.value);
                      }}
                      className="bg-[#F9FAFB] border border-[#E5E7EB] rounded px-4 py-3 text-sm text-[#111827] w-full focus:outline-none focus:border-[#E63012] cursor-pointer"
                    >
                      {MOROCCAN_CITIES.map(c => (
                        <option key={c} value={c} className="bg-[#FFFFFF]">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#4B5563] uppercase">Code Postal (Optionnel)</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="bg-[#F9FAFB] border border-[#E5E7EB] rounded px-4 py-3 text-sm text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#4B5563] uppercase">Notes de livraison (Ex: Précisions d'accès)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-[#F9FAFB] border border-[#E5E7EB] rounded px-4 py-3 text-sm text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                  />
                </div>
              </div>

              {/* Step 2: Shipping method */}
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 space-y-4">
                <div className="flex items-center space-x-2 border-b border-[#E5E7EB] pb-3 mb-2">
                  <Truck className="w-5 h-5 text-[#E63012]" />
                  <h2 className="font-display font-black italic text-base text-[#111827] uppercase tracking-wider">2. Mode de Livraison</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Standard */}
                  <label className={`border rounded p-4 flex flex-col justify-between cursor-pointer transition-all ${
                    deliveryMethod === 'standard' ? 'border-[#E63012] bg-[#E63012]/5' : 'border-[#E5E7EB] bg-transparent hover:border-[#4B5563]'
                  }`}>
                    <input
                      type="radio"
                      name="delivery"
                      value="standard"
                      checked={deliveryMethod === 'standard'}
                      onChange={() => handleDeliveryChange('standard')}
                      className="sr-only"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#111827] uppercase">Standard (24h-48h)</p>
                      <p className="text-[10px] text-[#4B5563] mt-1">Livraison à domicile par messagerie rapide.</p>
                    </div>
                    <p className="text-xs font-mono font-bold text-[#E63012] mt-4">
                      {subtotal >= 2000 ? 'Gratuit' : '40,00 DH'}
                    </p>
                  </label>

                  {/* Pickup */}
                  <label className={`border rounded p-4 flex flex-col justify-between cursor-pointer transition-all ${
                    deliveryMethod === 'retrait' ? 'border-[#E63012] bg-[#E63012]/5' : 'border-[#E5E7EB] bg-transparent hover:border-[#4B5563]'
                  }`}>
                    <input
                      type="radio"
                      name="delivery"
                      value="retrait"
                      checked={deliveryMethod === 'retrait'}
                      onChange={() => handleDeliveryChange('retrait')}
                      className="sr-only"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#111827] uppercase">Retrait Showroom</p>
                      <p className="text-[10px] text-[#4B5563] mt-1">Retirez votre colis au Showroom Anfa, Casablanca.</p>
                    </div>
                    <p className="text-xs font-mono font-bold text-[#E63012] mt-4">
                      Gratuit
                    </p>
                  </label>
                </div>
              </div>

              {/* Step 3: Payment method */}
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 space-y-4">
                <div className="flex items-center space-x-2 border-b border-[#E5E7EB] pb-3 mb-2">
                  <CreditCard className="w-5 h-5 text-[#E63012]" />
                  <h2 className="font-display font-black italic text-base text-[#111827] uppercase tracking-wider">3. Mode de Paiement</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* COD */}
                  <label className="border border-[#E63012] bg-[#E63012]/5 rounded p-4 flex items-start space-x-3 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      readOnly
                      className="sr-only"
                    />
                    <ShieldCheck className="w-5 h-5 text-[#22C55E] shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-[#111827] uppercase">Paiement à la livraison</p>
                      <p className="text-[10px] text-[#4B5563] mt-1">Réglez le livreur en espèces lors de la réception de votre colis. Simple et rapide.</p>
                    </div>
                  </label>
                </div>
              </div>

            </form>
          </div>

          {/* Right Summary sidebar panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 space-y-4">
              <h2 className="font-display font-extrabold text-sm uppercase text-[#111827] tracking-wider border-b border-[#E5E7EB] pb-2">Récapitulatif Articles</h2>
              
              {/* Product thumbnails checklist */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-2 divide-y divide-[#E5E7EB]/40">
                {items.map((item) => (
                  <div key={item.variant.id} className="flex items-center space-x-3 pt-3 first:pt-0">
                    <img
                      src={item.product.primary_image}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover rounded bg-[#F9FAFB] border border-[#E5E7EB]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-mono text-[#E63012] font-black uppercase leading-none">{item.product.brand_name}</p>
                      <h4 className="text-xs font-bold text-[#111827] truncate mt-0.5 leading-snug">{item.product.name}</h4>
                      <p className="text-[9px] text-[#4B5563] font-bold uppercase mt-0.5">Taille: {item.variant.size || 'Unique'} x{item.quantity}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {formatPrice((item.product.sale_price ?? item.product.base_price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order total list */}
              <div className="border-t border-[#E5E7EB] pt-4 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-mono font-bold text-[#111827]">{formatPrice(subtotal)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-[#22C55E] font-medium">
                    <span>Remises & Coupons</span>
                    <span className="font-mono font-bold">-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Livraison ({deliveryMethod.toUpperCase()})</span>
                  <span className="font-mono font-bold text-[#111827]">
                    {shipping === 0 ? 'Gratuit' : formatPrice(shipping)}
                  </span>
                </div>

                <div className="flex justify-between border-t border-[#E5E7EB] pt-3 text-sm sm:text-base font-bold text-[#111827]">
                  <span>TOTAL À PAYER</span>
                  <span className="font-mono text-sm sm:text-base text-[#E63012]">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Confirm purchase Button */}
              <button
                onClick={handleCheckoutSubmit}
                disabled={isSubmitting || items.length === 0}
                className="w-full bg-[#E63012] hover:bg-[#111827] text-white py-4 rounded font-display font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-2 transition-all shadow red-glow disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>TRAITEMENT...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>CONFIRMER LA COMMANDE</span>
                  </>
                )}
              </button>

              <div className="bg-[#F9FAFB] p-3 border border-[#E5E7EB] rounded text-[10px] text-[#4B5563] leading-relaxed flex items-start space-x-2">
                <Info className="w-4 h-4 text-[#E63012] shrink-0" />
                <span>En confirmant, vous vous engagez à régler la commande en espèces au livreur lors de la livraison.</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Commande;
