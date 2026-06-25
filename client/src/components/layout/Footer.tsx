import React from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../../store/settings.ts';
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube, Linkedin, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings } = useSettingsStore();

  const phone = settings.whatsapp_number || '212661348190';
  const email = settings.contact_email || 'contact@motopaco.ma';
  const address = settings.store_address || 'Moto paco, Lotissement assaada n92 et ain atiq temara, Ain atiq 12000';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full relative" style={{ fontFamily: "'Montserrat', sans-serif" }}>

      {/* ── SECTION 1: White Background Cards and Trust Row ── */}
      <div className="bg-[#F9FAFB] border-t border-gray-200 py-10">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Card Blocks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            {/* Block 1: La Carte Cadeau */}
            <div className="bg-white border border-gray-100 p-6 rounded-lg shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 text-2xl">
                🎁
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 font-black text-[13px] uppercase tracking-wide mb-1.5">LA CARTE CADEAU</h3>
                <p className="text-gray-500 text-[11px] leading-relaxed mb-4">
                  Choisis le montant et offre une carte cadeau à ta mamie, elle va kiffer !
                </p>
                <Link 
                  to="/contact" 
                  className="inline-block bg-black hover:bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-5 py-2.5 transition-colors"
                >
                  EN SAVOIR PLUS
                </Link>
              </div>
            </div>

            {/* Block 2: C'est vous qui le dites (Reviews) */}
            <div className="bg-white border border-gray-100 p-6 rounded-lg shadow-sm flex flex-col justify-center items-center text-center">
              <h3 className="text-gray-900 font-black text-[12px] uppercase tracking-wider mb-3">C'EST VOUS QUI LE DITES</h3>
              
              <div className="flex items-center justify-center gap-6">
                {/* Google logo rating */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[20px] tracking-tighter">
                      <span className="text-[#4285F4]">G</span>
                      <span className="text-[#EA4335]">o</span>
                      <span className="text-[#FBBC05]">o</span>
                      <span className="text-[#4285F4]">g</span>
                      <span className="text-[#34A853]">l</span>
                      <span className="text-[#EA4335]">e</span>
                    </span>
                    <span className="text-gray-800 font-extrabold text-sm ml-0.5">4,8/5</span>
                  </div>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className="text-yellow-400 text-xs">★</span>
                    ))}
                  </div>
                </div>

                <div className="h-8 w-px bg-gray-200" />

                {/* Avis Vérifiés rating */}
                <div className="flex flex-col items-center">
                  <span className="text-orange-600 font-bold italic text-[14px]">Avis Vérifiés</span>
                  <span className="text-gray-400 text-[9px] font-bold mt-1">Plus de 4000 avis</span>
                </div>
              </div>
            </div>

            {/* Block 3: Rejoins la communauté */}
            <div className="bg-white border border-gray-100 p-6 rounded-lg shadow-sm flex flex-col justify-center items-center text-center">
              <h3 className="text-gray-900 font-black text-[12px] uppercase tracking-wider mb-2">REJOINS LA COMMUNAUTÉ !</h3>
              <p className="text-gray-500 text-[11px] mb-4">Des news, des jeux concours, des events etc...</p>
              
              <div className="flex items-center gap-3">
                <a
                  href="https://facebook.com/motopaco"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#3b5998] hover:opacity-90 flex items-center justify-center text-white transition-opacity"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4 fill-white" />
                </a>
                <a
                  href="https://instagram.com/motopaco"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#3f729b] hover:opacity-90 flex items-center justify-center text-white transition-opacity"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com/motopaco"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#ff0000] hover:opacity-90 flex items-center justify-center text-white transition-opacity"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4 fill-white" />
                </a>
                <a
                  href="https://linkedin.com/company/motopaco"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#0077b5] hover:opacity-90 flex items-center justify-center text-white transition-opacity"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4 fill-white" />
                </a>
              </div>
            </div>

          </div>

          {/* Trust points row */}
          <div className="border-t border-gray-200 pt-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 justify-items-center">
              {[
                { icon: '⭐', text: 'VOTRE SATISFACTION', sub: 'EST NOTRE OBJECTIF' },
                { icon: '💰', text: 'LES MEILLEURS PRIX', sub: 'DU MAROC' },
                { icon: '💵', text: 'PAIEMENT À LA LIVRAISON', sub: 'CASH À LA RÉCEPTION' },
                { icon: '🚚', text: 'LIVRAISON GRATUITE', sub: "DÈS 2000 DH D'ACHAT" },
                { icon: '🔄', text: 'RETOURS OFFERTS', sub: 'PENDANT 30 JOURS' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-black text-[11px] leading-tight uppercase tracking-wider">{item.text}</span>
                    <span className="text-gray-400 font-extrabold text-[9px] mt-0.5 tracking-wide">{item.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── SECTION 2: Black Background Columns ── */}
      <div className="bg-black text-gray-400 py-16 border-t-[3px] border-[#ff1a00]">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            
            {/* Column 1: Contact info */}
            <div>
              {/* White-boxed Red Logo */}
              <Link to="/" className="inline-block mb-6 bg-white p-1.5 rounded">
                <img src="/logo.png" alt="MOTO PACO" className="h-10 w-auto object-contain" />
              </Link>

              <h4 className="text-white font-black text-xs uppercase tracking-widest mb-4">NOUS CONTACTER</h4>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3 text-xs leading-relaxed">
                  <MapPin className="w-4 h-4 text-[#ff1a00] flex-shrink-0 mt-0.5" />
                  <span>{address}</span>
                </li>
                <li className="flex items-center gap-3 text-xs">
                  <Phone className="w-4 h-4 text-[#ff1a00]" />
                  <a href={`tel:+${phone}`} className="hover:text-white transition-colors font-bold">+{phone}</a>
                </li>
                <li className="flex items-center gap-3 text-xs">
                  <Mail className="w-4 h-4 text-[#ff1a00]" />
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a>
                </li>
              </ul>
            </div>

            {/* Column 2: Informations */}
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6">INFORMATIONS</h4>
              <ul className="space-y-2.5 text-xs font-bold">
                {[
                  { label: 'FAQ', href: '/contact' },
                  { label: 'Blog', href: '/contact' },
                  { label: 'Codes promos et packs', href: '/boutique' },
                  { label: 'Programme fidélité', href: '/contact' },
                  { label: 'Qui sommes nous ?', href: '/contact' },
                  { label: 'Nous contacter', href: '/contact' },
                  { label: 'Mentions légales', href: '/contact' },
                  { label: 'Conditions générales de ventes', href: '/contact' },
                  { label: 'Protection données personnelles', href: '/contact' },
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link to={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Mon Compte */}
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6">MON COMPTE</h4>
              <ul className="space-y-2.5 text-xs font-bold">
                {[
                  { label: 'Mes informations', href: '/compte' },
                  { label: 'Mes adresses', href: '/compte' },
                  { label: 'Historique des commandes', href: '/compte' },
                  { label: 'Avoirs', href: '/compte' },
                  { label: 'Bons de réduction', href: '/compte' },
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link to={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Partners & Secure payments */}
            <div className="space-y-8">
              {/* Ils parlent de nous */}
              <div>
                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-4">ILS PARLENT DE NOUS</h4>
                <div className="flex items-center gap-3">
                  {/* RMC Sport block */}
                  <div className="bg-[#000] border border-gray-800 px-3 py-1 flex items-center justify-center font-extrabold text-[11px] text-white">
                    RMC <span className="text-[#ff1a00] ml-1">SPORT</span>
                  </div>
                  {/* Avis Vérifiés block */}
                  <div className="bg-white px-3 py-1 flex items-center justify-center font-bold italic text-[10px] text-orange-600 rounded-sm">
                    Avis Vérifiés
                  </div>
                  {/* C News block */}
                  <div className="bg-black border border-gray-800 px-2 py-1 flex items-center justify-center font-black text-[10px] text-white tracking-tighter">
                    C <span className="bg-[#ff1a00] text-white px-1 ml-0.5 rounded-sm">NEWS</span>
                  </div>
                </div>
              </div>

              {/* Payments 100% sécurisés */}
              <div>
                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-4">MODE DE PAIEMENT</h4>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2.5 flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-wider">
                    <span className="text-base">💵</span>
                    <span>Paiement à la livraison</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ── SECTION 3: Bottom Copyright bar ── */}
      <div className="bg-[#111] text-gray-500 py-4 border-t border-gray-900">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            © 2026 <strong className="text-gray-300">MOTO PACO</strong> — Équipement Moto &amp; Accessoires Maroc. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/contact" className="hover:text-white transition-colors">Mentions Légales</Link>
            <span className="text-gray-800">|</span>
            <Link to="/contact" className="hover:text-white transition-colors">CGV</Link>
            <span className="text-gray-800">|</span>
            <Link to="/contact" className="hover:text-white transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="hidden md:flex fixed bottom-6 right-6 z-40 bg-[#ff1a00] hover:bg-black text-white p-3 rounded-full shadow-lg transition-colors cursor-pointer group items-center justify-center"
        title="Retour en haut"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
      </button>

    </footer>
  );
};

export default Footer;
