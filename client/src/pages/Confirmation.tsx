import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Truck, Compass, PhoneCall } from 'lucide-react';
import api from '../lib/api.ts';
import { Order } from '../types/order.ts';
import { formatPrice } from '../lib/formatters.ts';
import SEOHead from '../components/seo/SEOHead.tsx';
import { useSettingsStore } from '../store/settings.ts';

export const Confirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || '';
  const phone = searchParams.get('phone') || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderNumber || !phone) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await api.get(`/orders/${orderNumber}?phone=${encodeURIComponent(phone)}`);
        setOrder(response.data);
      } catch (err) {
        console.error('Error fetching confirmation order details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderNumber, phone]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] pt-32 pb-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E63012]"></div>
      </div>
    );
  }

  const [isRedirecting, setIsRedirecting] = useState(false);

  const { settings } = useSettingsStore();
  const phoneVal = settings.whatsapp_number || '212667389916';
  
  // Construct pre-filled detailed order receipt text
  let messageText = '';
  if (order) {
    const itemsListText = order.items
      ? order.items
          .map(
            (i) =>
              `- ${i.product_name} (${i.variant_label || 'Unique'}) x${
                i.quantity
              } : ${formatPrice(i.line_total)}`
          )
          .join('\n')
      : '';

    messageText =
      `Bonjour MOTO PACO, voici les détails de ma commande #${order.order_number} :\n\n` +
      `Nom: ${order.shipping_first_name} ${order.shipping_last_name}\n` +
      `Tél: ${order.shipping_phone}\n` +
      `Adresse: ${order.shipping_address}, ${order.shipping_city}\n\n` +
      `Articles:\n${itemsListText}\n\n` +
      `Sous-total: ${formatPrice(order.subtotal)}\n` +
      `Frais de livraison: ${
        order.shipping_cost === 0 ? 'Gratuit' : formatPrice(order.shipping_cost)
      }\n` +
      `Total: ${formatPrice(order.total)}\n` +
      `Mode de Paiement: Paiement à la livraison`;
  } else {
    messageText = `Bonjour MOTO PACO, je souhaiterais suivre l'état de ma commande numéro : ${
      orderNumber || 'MOTO-PACO'
    }`;
  }

  const waUrl = `https://wa.me/${phoneVal}?text=${encodeURIComponent(messageText)}`;

  useEffect(() => {
    if (order) {
      const sessionKey = `wa_redirect_${order.order_number}`;
      const alreadyRedirected = sessionStorage.getItem(sessionKey);
      if (!alreadyRedirected) {
        setIsRedirecting(true);
        sessionStorage.setItem(sessionKey, 'true');
        const timer = setTimeout(() => {
          window.location.href = waUrl;
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [order, waUrl]);

  // Determine active status tracking steps
  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'confirmed': return 2;
      case 'preparing': return 3;
      case 'shipped': return 4;
      case 'delivered': return 5;
      default: return 1;
    }
  };

  const currentStep = order ? getStatusStep(order.status) : 1;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-28 pb-16 text-[#111827]">
      <SEOHead
        title="Confirmation de votre commande | MOTO PACO"
        description="Votre commande est confirmée chez MOTO PACO. Suivez son état ou contactez-nous via WhatsApp."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top visual success badge */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-8 text-center space-y-4 flex flex-col items-center">
          <CheckCircle2 className="w-16 h-16 text-[#22C55E] mx-auto animate-pulse" />
          <h1 className="race-livery text-2xl sm:text-4xl text-[#111827]">COMMANDE VALIDÉE !</h1>
          <p className="text-sm text-[#4B5563] max-w-md mx-auto leading-relaxed font-body">
            Merci pour votre confiance. Votre commande a été enregistrée avec succès sous le numéro :
          </p>
          <p className="font-mono text-lg font-bold text-[#E63012] bg-[#F9FAFB] inline-block px-4 py-2 border border-[#E5E7EB] rounded">
            {orderNumber}
          </p>

          {isRedirecting && (
            <div className="mt-2 text-xs font-black uppercase tracking-wider text-green-600 bg-green-50 px-4 py-2 border border-green-200 rounded flex items-center space-x-2 animate-pulse">
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-green-600 border-r-2 border-transparent"></span>
              <span>Redirection vers WhatsApp en cours...</span>
            </div>
          )}

          {/* Beautiful Alert/Notice Card */}
          <div className="my-6 bg-[#FFF5F5] border-l-4 border-[#E63012] rounded-r p-6 max-w-xl mx-auto text-left flex items-start space-x-4 shadow-sm">
            <div className="p-2 rounded-full bg-[#E63012]/10 text-[#E63012] shrink-0 mt-0.5 animate-pulse">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-black text-xs tracking-wider text-[#E63012] uppercase">Confirmation Téléphonique Requise</h4>
              <p className="text-xs text-[#5C3E3E] font-medium leading-relaxed font-body">
                Notre service client va vous appeler par téléphone dans quelques instants pour confirmer votre adresse et valider la livraison. <strong>Veuillez rester à proximité de votre téléphone et répondre à notre appel.</strong>
              </p>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#22C55E] hover:bg-[#1eb052] text-white px-8 py-4 rounded font-display text-xs font-black uppercase tracking-wider inline-flex items-center space-x-2 transition-colors shadow-lg border border-[#1eb052] hover:scale-[1.02] transform duration-150"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.017-5.114-2.871-6.973-1.854-1.859-4.33-2.88-6.967-2.881-5.441 0-9.869 4.42-9.873 9.863-.001 1.701.45 3.361 1.307 4.8l-.348 1.272.368-.345zm1.183-11.785c-.214-.478-.44-.488-.642-.496-.166-.007-.356-.007-.547-.007-.19 0-.5.07-.762.356-.262.285-1 .978-1 2.387 0 1.41 1.025 2.775 1.168 2.966.143.19 2.016 3.078 4.885 4.318.682.295 1.215.47 1.629.601.685.218 1.31.187 1.803.113.55-.082 1.688-.69 1.925-1.356.238-.666.238-1.238.167-1.356-.07-.119-.262-.19-.548-.333-.285-.143-1.688-.833-1.95-.928-.261-.095-.452-.143-.642.143-.19.285-.737.928-.904 1.119-.166.19-.333.214-.618.07-.285-.143-1.205-.444-2.296-1.417-.848-.756-1.421-1.69-1.587-1.976-.167-.285-.018-.44.125-.58.127-.127.285-.333.428-.5.143-.166.19-.285.285-.476.095-.19.048-.356-.024-.5-.071-.143-.642-1.547-.88-2.12z" />
              </svg>
              <span>Envoyer ma commande sur WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Step-by-Step Tracking Status Panel */}
        {order && (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 sm:p-8 space-y-6">
            <h3 className="font-display font-black italic text-lg uppercase tracking-wide text-[#111827] border-b border-[#E5E7EB] pb-3 flex items-center space-x-2">
              <Truck className="w-5 h-5 text-[#E63012]" />
              <span>État de livraison</span>
            </h3>

            {/* Steps line */}
            <div className="grid grid-cols-5 text-center text-[9px] sm:text-xs font-bold relative pt-6">
              {/* Connecting line */}
              <div className="absolute top-9 left-[10%] right-[10%] h-0.5 bg-[#E5E7EB] z-0">
                <div
                  className="bg-[#E63012] h-0.5 transition-all duration-700"
                  style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                ></div>
              </div>

              {/* Step dots */}
              {[
                { label: 'Reçue', stepNum: 1 },
                { label: 'Confirmée', stepNum: 2 },
                { label: 'Préparation', stepNum: 3 },
                { label: 'Expédiée', stepNum: 4 },
                { label: 'Livrée', stepNum: 5 }
              ].map((st) => (
                <div key={st.stepNum} className="flex flex-col items-center z-10 relative">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                    currentStep >= st.stepNum 
                      ? 'bg-[#E63012] border-[#E63012] text-white' 
                      : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#4B5563]'
                  }`}>
                    {st.stepNum}
                  </div>
                  <span className={`mt-2 font-display uppercase tracking-wider ${currentStep >= st.stepNum ? 'text-[#E63012]' : 'text-[#4B5563]'}`}>
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order detail checklist panel */}
        {order && (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 sm:p-8 space-y-4">
            <h3 className="font-display font-black italic text-lg uppercase tracking-wide text-[#111827] border-b border-[#E5E7EB] pb-3 flex items-center space-x-2">
              <Package className="w-5 h-5 text-[#E63012]" />
              <span>Détails de la commande</span>
            </h3>

            <div className="space-y-4 divide-y divide-[#E5E7EB]">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center pt-4 first:pt-0">
                  <div className="flex items-center space-x-3">
                    {item.primary_image && (
                      <img src={item.primary_image} alt={item.product_name} referrerPolicy="no-referrer" className="w-12 h-12 object-cover rounded bg-[#F9FAFB] border border-[#E5E7EB]" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-[#111827] leading-tight">{item.product_name}</h4>
                      <p className="text-[10px] text-[#4B5563] font-bold uppercase mt-1">Taille/Option: {item.variant_label} x{item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#111827]">
                    {formatPrice(item.line_total)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="border-t border-[#E5E7EB] pt-4 text-sm space-y-2">
              <div className="flex justify-between text-[#4B5563]">
                <span>Sous-total</span>
                <span className="font-mono font-bold text-[#111827]">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-[#22C55E]">
                  <span>Remises</span>
                  <span className="font-mono font-bold">-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#4B5563]">
                <span>Frais de livraison</span>
                <span className="font-mono font-bold text-[#111827]">
                  {order.shipping_cost === 0 ? 'Gratuit' : formatPrice(order.shipping_cost)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E5E7EB] pt-3 text-base font-bold text-[#111827]">
                <span>TOTAL À RÉGLER (COD)</span>
                <span className="font-mono text-base text-[#E63012]">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action back home */}
        <div className="text-center pt-4">
          <Link
            to="/boutique"
            className="bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#E63012] text-[#111827] px-8 py-4 rounded font-display text-xs font-extrabold uppercase tracking-wider transition-colors inline-flex items-center space-x-2"
          >
            <Compass className="w-4 h-4" />
            <span>CONTINUER LES ACHATS</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Confirmation;
