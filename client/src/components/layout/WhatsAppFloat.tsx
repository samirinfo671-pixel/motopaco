import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '../../store/settings.ts';

interface WhatsAppFloatProps {
  productName?: string;
}

export const WhatsAppFloat: React.FC<WhatsAppFloatProps> = ({ productName }) => {
  const { settings } = useSettingsStore();
  const location = useLocation();
  const isProductPage = location.pathname.startsWith('/produit/');
  
  const phone = settings.whatsapp_number || '212600112233'; // Dynamic or fallback
  const message = productName
    ? `Bonjour MOTO PACO, je souhaiterais avoir des informations concernant le produit : ${productName}`
    : `Bonjour MOTO PACO, je souhaiterais me renseigner sur vos équipements de moto disponibles.`;

  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed ${isProductPage ? 'bottom-[136px]' : 'bottom-20'} md:bottom-20 right-6 z-40 bg-[#22C55E] hover:bg-[#1eb052] text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center border border-white/10`}
      aria-label="Contacter sur WhatsApp"
    >
      <svg
        className="w-6 h-6 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.46h.007c5.626 0 10.201-4.577 10.204-10.207a10.124 10.124 0 0 0-2.993-7.21 10.134 10.134 0 0 0-7.212-2.991c-5.631 0-10.21 4.58-10.213 10.208-.002 1.922.501 3.8 1.458 5.4l-.985 3.597 3.693-.968zm11.584-6.425c-.31-.156-1.836-.906-2.115-1.007-.28-.101-.483-.151-.686.151-.203.303-.787 1.007-.965 1.209-.177.202-.355.226-.665.07-.31-.156-1.31-.482-2.496-1.54-1.006-.897-1.684-2.007-1.88-2.34-.197-.334-.02-.515.147-.68.15-.148.31-.355.466-.533.156-.178.208-.303.31-.505.102-.202.05-.378-.025-.53-.076-.151-.686-1.65-.94-2.259-.247-.597-.5-.515-.686-.525-.178-.008-.38-.01-.58-.01-.2 0-.526.075-.802.378-.276.303-1.054 1.03-1.054 2.513s1.08 2.916 1.232 3.118c.152.202 2.126 3.245 5.15 4.553.719.311 1.28.497 1.718.637.722.23 1.378.197 1.9.12.58-.087 1.837-.751 2.096-1.44.259-.69.259-1.283.182-1.408-.076-.126-.28-.202-.59-.359z" />
      </svg>
    </a>
  );
};

export default WhatsAppFloat;
