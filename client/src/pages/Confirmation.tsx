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

  const { settings } = useSettingsStore();
  const phoneVal = settings.whatsapp_number || '212667389916';
  // Derive WhatsApp support link with customized order query message
  const waUrl = `https://wa.me/${phoneVal}?text=${encodeURIComponent(
    `Bonjour MOTO PACO, je souhaiterais suivre l'état de ma commande numéro : ${orderNumber || 'MOTO-PACO'}`
  )}`;

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
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-8 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-[#22C55E] mx-auto animate-pulse" />
          <h1 className="race-livery text-2xl sm:text-4xl text-[#111827]">COMMANDE VALIDÉE !</h1>
          <p className="text-sm text-[#4B5563] max-w-md mx-auto leading-relaxed font-body">
            Merci pour votre confiance. Votre commande a été enregistrée avec succès sous le numéro :
          </p>
          <p className="font-mono text-lg font-bold text-[#E63012] bg-[#F9FAFB] inline-block px-4 py-2 border border-[#E5E7EB] rounded">
            {orderNumber}
          </p>
          <div className="pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#22C55E] hover:bg-[#1eb052] text-white px-6 py-3 rounded font-display text-xs font-bold uppercase tracking-wider inline-flex items-center space-x-2 transition-colors shadow"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Suivre via WhatsApp</span>
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
                      <img src={item.primary_image} alt={item.product_name} className="w-12 h-12 object-cover rounded bg-[#F9FAFB] border border-[#E5E7EB]" />
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
