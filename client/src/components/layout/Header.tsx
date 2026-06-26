import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, ChevronDown, ChevronRight, Loader2, X, Menu, User, Phone, HelpCircle } from 'lucide-react';
import { useCartStore } from '../../store/cart.ts';
import { useAuthStore } from '../../store/auth.ts';
import { useUIStore } from '../../store/ui.ts';
import { useDebounce } from '../../hooks/useDebounce.ts';
import { formatPrice } from '../../lib/formatters.ts';
import api from '../../lib/api.ts';
import { Product } from '../../types/product.ts';

/* ─── Mega-menu data ─────────────────────────────────────────── */
const megaMenuData = [
  {
    label: 'CASQUES',
    href: '/categorie/casques',
    submenu: [
      {
        title: 'Nos Types de Casque',
        items: [
          { label: 'Casque Intégral', href: '/categorie/casques' },
          { label: 'Casque Modulable', href: '/categorie/casques' },
          { label: 'Casque Jet', href: '/categorie/casques' },
          { label: 'Casque Cross & Enduro', href: '/categorie/casques' },
          { label: 'Visière Casque Moto', href: '/categorie/casques' },
        ],
      },
      {
        title: 'Nos Marques Phares',
        items: [
          { label: 'AGV', href: '/boutique?brand=agv' },
          { label: 'TCX', href: '/boutique?brand=tcx' },
          { label: 'GIVI', href: '/boutique?brand=givi' },
          { label: 'DID', href: '/boutique?brand=did' },
          { label: '100%', href: '/boutique?brand=100-percent' },
          { label: 'Akrapovic', href: '/boutique?brand=akrapovic' },
          { label: 'Kenny', href: '/boutique?brand=kenny' },
          { label: 'Fox Racing', href: '/boutique?brand=fox-racing' },
          { label: 'ODI', href: '/boutique?brand=odi' },
        ],
      },
    ],
  },
  {
    label: 'ÉQUIPEMENTS',
    href: '/boutique',
    submenu: [
      {
        title: 'Vêtements Moto',
        items: [
          { label: 'Blouson & Veste Moto', href: '/categorie/vestes-blousons' },
          { label: 'Veste Été', href: '/categorie/vestes-blousons' },
          { label: 'Veste Hiver', href: '/categorie/vestes-blousons' },
          { label: 'Veste Pluie', href: '/categorie/vestes-blousons' },
          { label: 'Pantalon Moto', href: '/categorie/pantalons' },
          { label: 'Combinaison Moto', href: '/categorie/vestes-blousons' },
          { label: 'Gilet Airbag Moto', href: '/categorie/protections' },
        ],
      },
      {
        title: 'Gants & Chaussures',
        items: [
          { label: 'Gants Moto', href: '/categorie/gants' },
          { label: 'Gants Moto Été', href: '/categorie/gants' },
          { label: 'Gants Hiver', href: '/categorie/gants' },
          { label: 'Gants Chauffants', href: '/categorie/gants' },
          { label: 'Bottes Moto', href: '/categorie/bottes' },
          { label: 'Chaussures Moto', href: '/categorie/bottes' },
          { label: 'Protections Corps', href: '/categorie/protections' },
        ],
      },
    ],
  },
  {
    label: 'ACCESSOIRES',
    href: '/boutique',
    submenu: [
      {
        title: 'Bagagerie & Sécurité',
        items: [
          { label: 'Top-Case & Valises', href: '/categorie/bagagerie' },
          { label: 'Sacoches Moto', href: '/categorie/sacoches' },
          { label: 'Sac à Dos Moto', href: '/categorie/bagagerie' },
          { label: 'Antivol Moto', href: '/categorie/protections' },
          { label: 'Bloque Disque', href: '/categorie/protections' },
          { label: 'Chaine Antivol', href: '/categorie/protections' },
        ],
      },
      {
        title: 'High-Tech & Équipement',
        items: [
          { label: 'Intercom Bluetooth', href: '/categorie/accessoires-usb' },
          { label: 'GPS Moto', href: '/categorie/accessoires-usb' },
          { label: 'Support Mobile Moto', href: '/categorie/accessoires-usb' },
          { label: 'Bulle & Pare-Brise', href: '/boutique' },
          { label: 'Manchons Scooter', href: '/boutique' },
          { label: 'Tabliers Scooter', href: '/boutique' },
        ],
      },
    ],
  },
  {
    label: 'ENTRETIEN',
    href: '/boutique',
    submenu: [
      {
        title: 'Produits Entretien',
        items: [
          { label: 'Huile Moteur 2T', href: '/boutique' },
          { label: 'Huile Moteur 4T', href: '/boutique' },
          { label: 'Batterie Moto', href: '/boutique' },
          { label: 'Kit Chaîne', href: '/categorie/kit-chaine' },
          { label: 'Nettoyant Moto', href: '/boutique' },
          { label: 'Échappements', href: '/categorie/echappements' },
        ],
      },
    ],
  },
];

/* ─── Helper Icons ───────────────────────────────────────────── */
const HelpIcon: React.FC<{ white?: boolean }> = ({ white }) => (
  <img 
    src={white ? "/img/cms/Aide-Motomax-white.svg" : "/img/cms/Aide-Motomax.svg"} 
    alt="Aide" 
    className="w-[30px] h-[30px] object-contain" 
  />
);

const HelmetIcon: React.FC<{ white?: boolean }> = ({ white }) => (
  <img 
    src={white ? "/img/cms/PackMoto-ICONES-HEADER-MonCompte-white.svg" : "/img/cms/PackMoto-ICONES-HEADER-MonCompte.svg"} 
    alt="Mon Compte" 
    className="w-[30px] h-[30px] object-contain" 
  />
);

/* ─── Custom megamenu images ─────────────────────────────────── */


const BrandAGV = () => (
  <svg viewBox="0 0 100 45" className="h-9 w-auto">
    <path d="M15 5 C15 5, 50 2, 85 5 C85 25, 75 40, 50 43 C25 40, 15 25, 15 5 Z" fill="none" stroke="black" strokeWidth="2.5" />
    <text x="50" y="28" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="19" fontStyle="italic" textAnchor="middle" fill="black">AGV</text>
  </svg>
);

const BrandTCX = () => (
  <svg viewBox="0 0 100 45" className="h-9 w-auto">
    <text x="50" y="25" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="23" fontStyle="italic" textAnchor="middle" fill="black">TCX</text>
    <path d="M20 30 L80 30" stroke="#E63012" strokeWidth="2.5" />
    <text x="50" y="38" fontFamily="sans-serif" fontSize="5" fontWeight="black" textAnchor="middle" fill="black" letterSpacing="1">FOCUS ON BOOTS</text>
  </svg>
);

const BrandGIVI = () => (
  <svg viewBox="0 0 100 45" className="h-9 w-auto">
    <rect x="5" y="6" width="90" height="33" rx="3" fill="none" stroke="black" strokeWidth="2.5" />
    <text x="50" y="30" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="21" textAnchor="middle" fill="black" letterSpacing="1">GIVI</text>
  </svg>
);

const BrandDID = () => (
  <svg viewBox="0 0 100 45" className="h-9 w-auto">
    <path d="M15 22.5 H85" stroke="black" strokeWidth="6" strokeLinecap="round" opacity="0.1" />
    <text x="50" y="30" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="23" textAnchor="middle" fill="black" letterSpacing="0.5">D.I.D</text>
  </svg>
);

const BrandOneHundred = () => (
  <svg viewBox="0 0 100 45" className="h-9 w-auto">
    <polygon points="20,12 50,4 80,12 80,33 50,41 20,33" fill="none" stroke="black" strokeWidth="2.5" />
    <text x="50" y="27" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="16" textAnchor="middle" fill="black">100%</text>
  </svg>
);

const BrandAkrapovic = () => (
  <svg viewBox="0 0 100 45" className="h-9 w-auto">
    <text x="50" y="24" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="13" textAnchor="middle" fill="black" letterSpacing="0.5">AKRAPOVIC</text>
    <path d="M15 30 Q50 35 85 30" stroke="#E63012" strokeWidth="2" fill="none" />
  </svg>
);

const BrandKenny = () => (
  <svg viewBox="0 0 100 45" className="h-9 w-auto">
    <text x="50" y="29" fontFamily="'Montserrat', sans-serif" fontWeight="950" fontSize="20" fontStyle="italic" textAnchor="middle" fill="black" letterSpacing="0.5">KENNY</text>
  </svg>
);

const BrandFoxRacing = () => (
  <svg viewBox="0 0 100 45" className="h-9 w-auto" fill="none" stroke="black" strokeWidth="1.5">
    <path d="M50 8 L32 20 L38 23 L25 32 L44 32 L50 38 L56 32 L75 32 L62 23 L68 20 Z" fill="black" />
    <circle cx="43" cy="24" r="1.5" fill="white" stroke="none" />
    <circle cx="57" cy="24" r="1.5" fill="white" stroke="none" />
  </svg>
);

const BrandODI = () => (
  <svg viewBox="0 0 100 45" className="h-9 w-auto">
    <text x="50" y="29" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="24" textAnchor="middle" fill="black" letterSpacing="1">ODI</text>
  </svg>
);

const IconJacket = () => (
  <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4 L8 2 L12 6 L16 2 L20 4 L20 20 L16 22 L12 18 L8 22 L4 20 Z" />
    <path d="M8 2 L12 7 L16 2" />
    <path d="M12 7 L12 18" />
    <path d="M7 6 L7 20" />
    <path d="M17 6 L17 20" />
  </svg>
);

const IconGloves = () => (
  <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 14 C6 11, 5 7, 7 7 C8.5 7, 8 11, 8 11 M8 11 C8 10, 8 5, 9.5 5 C11 5, 10.5 11, 10.5 11 M10.5 11 C10.5 9, 11 4, 12.5 4 C14 4, 13 11, 13 11 M13 11 C13 10, 14 6, 15.5 6 C17 6, 16 11, 16 13 C16 16, 15 20, 11 20 C7 20, 6 17, 6 14" />
    <path d="M6 14 C5.5 14, 3 13, 3.5 11.5 C4 10, 6 12, 6 13" />
    <path d="M6 18 H16" />
  </svg>
);

const IconPants = () => (
  <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3 H18 V7 L16 21 H12.5 L12 10 L11.5 21 H8 L6 7 Z" />
    <path d="M9 3 V5" />
    <path d="M15 3 V5" />
    <rect x="7.5" y="11" width="3" height="4" rx="1" />
    <rect x="13.5" y="11" width="3" height="4" rx="1" />
  </svg>
);

const IconBoots = () => (
  <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3 H14 V13 L19 16 C20 17, 20 19, 18 19 H7 C6 19, 6 18, 6 17 V5 C6 4, 7 3, 8 3 Z" />
    <path d="M6 17 H18" />
    <path d="M7 19 V21" />
    <path d="M16 19 V21" />
    <path d="M9 5 H12 V9 H9 Z" />
  </svg>
);

const IconRain = () => (
  <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 12 A4 4 0 0 0 17 4 A5 5 0 0 0 7 6 A4 4 0 0 0 7 12 H17" />
    <path d="M9 15 L8 18" />
    <path d="M12 15 L11 18" />
    <path d="M15 15 L14 18" />
  </svg>
);

const IconLock = () => (
  <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    <path d="M8 11 V7 A4 4 0 0 1 16 7 V11" />
  </svg>
);

const IconBluetooth = () => (
  <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7 L17 17 L12 22 V2 L17 7 L7 17" />
  </svg>
);

const IconTopcase = () => (
  <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="8" width="16" height="12" rx="2" />
    <path d="M4 11 H20" />
    <rect x="10" y="10" width="4" height="3" rx="0.5" />
    <path d="M9 8 V6 H15 V8" />
  </svg>
);

const IconWinter = () => (
  <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7 H16 A3 3 0 0 1 19 10" />
    <path d="M4 12 H18 A3 3 0 0 0 21 9" />
    <path d="M2 17 H14 A3 3 0 0 1 17 20" />
    <rect x="6" y="9" width="10" height="6" rx="2" strokeDasharray="3,3" />
  </svg>
);

const IconWindshield = () => (
  <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 22 L4 10 Q12 6 20 10 L18 22 H6 Z" />
    <path d="M9 12 Q12 10 15 12" />
    <path d="M8 17 Q12 15 16 17" />
  </svg>
);

const IconOil = () => (
  <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 21 H19 V10 L12 6 L5 10 Z" />
    <path d="M12 6 V3 H15" />
    <path d="M5 12 H3 V18 H5" />
    <path d="M12 11 C11 11, 10 12, 10 13 C10 14.1, 10.9 15, 12 15 C13.1 15, 14 14.1, 14 13 C14 12, 13 11, 12 11 Z" fill="currentColor" />
  </svg>
);

/* ─── Component ──────────────────────────────────────────────── */
export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCartStore();
  const { user } = useAuthStore();
  const { setCartOpen, setMobileNavOpen, isMobileNavOpen } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuTimer, setMenuTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const cartQty = items.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = items.reduce((s, i) => s + i.quantity * (i.product.sale_price !== null ? i.product.sale_price : i.product.base_price), 0);

  /* Live search */
  useEffect(() => {
    if (!debouncedQuery.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    api.get(`/products?search=${encodeURIComponent(debouncedQuery)}&limit=6`)
      .then(r => setSearchResults(r.data.products || []))
      .catch(() => {})
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  /* Close search on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) setMobileSearchOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* Reset on route change */
  useEffect(() => {
    setShowSearch(false); setSearchQuery(''); setActiveMenu(null);
    setMobileNavOpen(false); setMobileSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { navigate(`/boutique?search=${encodeURIComponent(searchQuery.trim())}`); setShowSearch(false); setMobileSearchOpen(false); }
  };

  /* Hover menu with a tiny delay so user can move to dropdown */
  const openMenu = (label: string) => {
    if (menuTimer) clearTimeout(menuTimer);
    setActiveMenu(label);
  };
  const closeMenu = () => {
    const t = setTimeout(() => setActiveMenu(null), 150);
    setMenuTimer(t);
  };

  const searchDropdown = (
    <>
      {isSearching && (
        <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Recherche en cours...
        </div>
      )}
      {!isSearching && searchResults.length === 0 && searchQuery.trim() && (
        <div className="px-4 py-3 text-sm text-gray-500">Aucun produit trouvé.</div>
      )}
      {!isSearching && searchResults.map(p => (
        <Link
          key={p.id}
          to={`/produit/${p.slug}`}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0"
          onClick={() => { setShowSearch(false); setMobileSearchOpen(false); }}
        >
          <img src={p.primary_image} alt={p.name} referrerPolicy="no-referrer" className="w-10 h-10 object-cover rounded border border-gray-100 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#E63012] uppercase">{p.brand_name}</p>
            <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {p.sale_price !== null ? (
              <>
                <p className="text-xs text-gray-400 line-through">{formatPrice(p.base_price)}</p>
                <p className="text-sm font-bold text-[#E63012]">{formatPrice(p.sale_price)}</p>
              </>
            ) : (
              <p className="text-sm font-bold text-gray-800">{formatPrice(p.base_price)}</p>
            )}
          </div>
        </Link>
      ))}
      {!isSearching && searchResults.length > 0 && (
        <button
          onClick={() => { navigate(`/boutique?search=${encodeURIComponent(searchQuery)}`); setShowSearch(false); setMobileSearchOpen(false); }}
          className="w-full py-2.5 text-xs font-bold text-white uppercase tracking-wider text-center transition-colors bg-[#E63012] hover:bg-red-700"
        >
          Voir tous les résultats →
        </button>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>

      {/* ── ROW 1: Top info bar ──────────────────────────────── */}
      {/* Desktop: 3-column layout */}
      <div style={{ backgroundColor: '#000' }} className="hidden lg:block py-2 px-4">
        <div className="max-w-[1650px] mx-auto flex items-center justify-between gap-4 text-[11px]">
          {/* Left: Stars + Avis Vérifiés */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="flex gap-0.5 mr-1">
              {[1,2,3,4,5].map(i => (
                <svg key={i} viewBox="0 0 12 12" className="w-[14px] h-[14px]" fill="#E63012">
                  <polygon points="6,1 7.5,4.5 11,4.5 8.5,7 9.5,11 6,8.5 2.5,11 3.5,7 1,4.5 4.5,4.5" />
                </svg>
              ))}
            </div>
            <span className="font-bold text-white text-[13px] mr-1">4,8<span className="text-[10px] text-gray-400">/5</span></span>
            <span style={{ color: '#E63012', fontFamily: "'Dancing Script', 'Caveat', cursive", fontSize: '18px' }} className="mr-1">Avis Vérifiés</span>
            <a href="#" className="text-gray-400 hover:text-white text-[10px] uppercase ml-1">Voir tous les avis</a>
          </div>
          {/* Center: tagline */}
          <div className="font-bold text-white uppercase text-[12px] text-center flex-1 italic tracking-wide">
            EQUIPEMENT MOTO &amp; ACCESSOIRE SCOOTER
          </div>
          {/* Right: Free delivery */}
          <div className="flex items-center gap-2 whitespace-nowrap text-white text-[12px]">
            <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16,8 20,8 23,11 23,16 16,16" />
              <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span>
              <strong className="text-[#E63012] font-black">LIVRAISON OFFERTE</strong>
              <span className="font-bold text-white"> À PARTIR DE 2000 DH</span>
            </span>
          </div>
        </div>
      </div>

      {/* Mobile: single condensed delivery bar */}
      <div style={{ backgroundColor: '#000' }} className="lg:hidden py-1.5 px-3 flex items-center justify-center gap-2 text-[11px]">
        <svg className="w-4 h-4 flex-shrink-0 text-[#E63012]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16,8 20,8 23,11 23,16 16,16" />
          <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        <span className="text-white font-bold text-[11px] tracking-wide">
          🎉 <span style={{ color: '#E63012' }}>LIVRAISON OFFERTE</span> dès <strong>2000 DH</strong>
        </span>
      </div>

      {/* ── ROW 2: Desktop Logo + Search + Icons ─────────────────── */}
      <div className={`hidden lg:block transition-all duration-300 border-b ${isHome && !isScrolled ? 'bg-transparent border-transparent' : 'bg-white border-gray-200'}`}>
        <div className="max-w-[1650px] mx-auto px-4 flex items-center justify-between gap-4 h-[80px]">
          {/* MOTO PACO Logo */}
          <div className="lg:w-auto xl:w-[220px] flex-shrink-0 flex justify-start">
            <Link to="/" className="flex items-center py-1" aria-label="MOTO PACO — Accueil">
              <img src={isHome && !isScrolled ? "/logo-white.png" : "/logo.png"} alt="MOTO PACO" className="h-10 xl:h-12 w-auto object-contain" />
            </Link>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-[550px] mx-2 xl:mx-auto relative">
            <div ref={searchRef} className="w-full relative">
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative w-full">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center ${isHome && !isScrolled ? 'text-white/60' : 'text-black/40'}`}>
                    <Search className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher une référence, une pièce..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                    onFocus={() => setShowSearch(true)}
                    className={`w-full rounded-full py-3 pl-12 pr-14 text-[14px] font-semibold transition-all shadow-inner focus:outline-none focus:bg-white focus:text-black focus:border-black focus:ring-4 focus:ring-black/5 ${isHome && !isScrolled ? 'bg-white/10 border-white/20 text-white placeholder-gray-300 hover:border-white/40' : 'bg-gray-50 border-gray-200 text-black placeholder-gray-400 hover:border-gray-300'}`}
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black hover:bg-gray-800 text-white w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95"
                    aria-label="Rechercher"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 text-white stroke-[2.5]" />}
                  </button>
                </div>
              </form>
              {showSearch && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-b z-50 mt-2.5 overflow-hidden">
                  {searchDropdown}
                </div>
              )}
            </div>
          </div>

          {/* Right icons: Aide & FAQ + Mon Compte + Panier */}
          <div className="lg:w-auto xl:w-[320px] flex-shrink-0 flex justify-end items-center gap-3 lg:gap-5 xl:gap-8 lg:pr-2 xl:pr-4">
            <Link to="/contact" className={`flex flex-col items-center gap-1 hover:text-[#E63012] transition-colors ${isHome && !isScrolled ? 'text-white' : 'text-black'}`} style={{ minWidth: 64 }}>
              <span className="transition-all duration-300 flex items-center justify-center"><HelpIcon white={isHome && !isScrolled} /></span>
              <span className="text-[9px] xl:text-[10px] font-bold italic uppercase tracking-wide mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>AIDE &amp; FAQ</span>
            </Link>
            <Link
              to={user?.role === 'admin' ? '/admin/dashboard' : '/compte'}
              className={`flex flex-col items-center gap-1 hover:text-[#E63012] transition-colors ${isHome && !isScrolled ? 'text-white' : 'text-black'}`}
              style={{ minWidth: 64 }}
            >
              <span className="transition-all duration-300 flex items-center justify-center"><HelmetIcon white={isHome && !isScrolled} /></span>
              <span className="text-[9px] xl:text-[10px] font-bold italic uppercase tracking-wide mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>MON COMPTE</span>
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className={`flex flex-col items-center gap-1 relative hover:opacity-85 transition-opacity ml-1 lg:ml-2 ${isHome && !isScrolled ? 'text-white' : 'text-black'}`}
              aria-label="Mon panier"
              style={{ minWidth: 64 }}
            >
              <div className="relative flex items-center justify-center">
                <ShoppingCart className="w-[30px] h-[30px]" fill={isHome && !isScrolled ? "#fff" : "#000"} color={isHome && !isScrolled ? "#fff" : "#000"} />
                <span className="absolute -top-1.5 -right-2.5 w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-sm bg-[#E63012]">
                  {cartQty}
                </span>
              </div>
              <span className="text-[11px] xl:text-[12px] text-[#E63012] font-bold italic mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {formatPrice(cartTotal)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Desktop Nav mega-menu ─────────────────────────────── */}
      <div className="border-b hidden lg:block relative transition-all duration-300" style={{ backgroundColor: isHome && !isScrolled ? 'transparent' : '#f2f2f2', borderBottomColor: isHome && !isScrolled ? 'transparent' : '#e5e7eb' }} onMouseLeave={closeMenu}>
        <div className="max-w-[1650px] mx-auto px-4 flex justify-center">
          <nav className="flex items-center justify-center">
            {/* CASQUES */}
            <div onMouseEnter={() => openMenu('CASQUES')} className={`border-l border-r transition-colors ${isHome && !isScrolled ? 'border-white/10' : 'border-gray-300/60'}`}>
              <Link to="/categorie/casques" className="flex items-center gap-1 px-3 xl:px-6 py-3.5 text-[12px] xl:text-[14px] uppercase tracking-wide whitespace-nowrap hover:text-[#E63012] transition-colors" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontStyle: 'italic', color: isHome && !isScrolled ? '#fff' : '#000' }}>
                CASQUES
                <ChevronDown className="w-3 h-3 transition-transform" style={{ color: isHome && !isScrolled ? '#fff' : '#000', transform: activeMenu === 'CASQUES' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </Link>
            </div>
            {/* ÉQUIPEMENTS */}
            <div onMouseEnter={() => openMenu('ÉQUIPEMENTS')} className={`border-r transition-colors ${isHome && !isScrolled ? 'border-white/10' : 'border-gray-300/60'}`}>
              <Link to="/boutique" className="flex items-center gap-1 px-3 xl:px-6 py-3.5 text-[12px] xl:text-[14px] uppercase tracking-wide whitespace-nowrap hover:text-[#E63012] transition-colors" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontStyle: 'italic', color: isHome && !isScrolled ? '#fff' : '#000' }}>
                ÉQUIPEMENTS
                <ChevronDown className="w-3 h-3 transition-transform" style={{ color: isHome && !isScrolled ? '#fff' : '#000', transform: activeMenu === 'ÉQUIPEMENTS' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </Link>
            </div>
            {/* ACCESSOIRES */}
            <div onMouseEnter={() => openMenu('ACCESSOIRES')} className={`border-r transition-colors ${isHome && !isScrolled ? 'border-white/10' : 'border-gray-300/60'}`}>
              <Link to="/boutique" className="flex items-center gap-1 px-3 xl:px-6 py-3.5 text-[12px] xl:text-[14px] uppercase tracking-wide whitespace-nowrap hover:text-[#E63012] transition-colors" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontStyle: 'italic', color: isHome && !isScrolled ? '#fff' : '#000' }}>
                ACCESSOIRES
                <ChevronDown className="w-3 h-3 transition-transform" style={{ color: isHome && !isScrolled ? '#fff' : '#000', transform: activeMenu === 'ACCESSOIRES' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </Link>
            </div>
            {/* ENTRETIEN */}
            <div onMouseEnter={() => openMenu('ENTRETIEN')} className={`border-r transition-colors ${isHome && !isScrolled ? 'border-white/10' : 'border-gray-300/60'}`}>
              <Link to="/boutique" className="flex items-center gap-1 px-3 xl:px-6 py-3.5 text-[12px] xl:text-[14px] uppercase tracking-wide whitespace-nowrap hover:text-[#E63012] transition-colors" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontStyle: 'italic', color: isHome && !isScrolled ? '#fff' : '#000' }}>
                ENTRETIEN
                <ChevronDown className="w-3 h-3 transition-transform" style={{ color: isHome && !isScrolled ? '#fff' : '#000', transform: activeMenu === 'ENTRETIEN' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </Link>
            </div>
            {/* MARQUES */}
            <div onMouseEnter={() => openMenu('MARQUES')} className={`border-r transition-colors ${isHome && !isScrolled ? 'border-white/10' : 'border-gray-300/60'}`}>
              <button
                className="flex items-center gap-1 px-3 xl:px-6 py-3.5 text-[12px] xl:text-[14px] uppercase tracking-wide whitespace-nowrap hover:text-[#E63012] transition-colors bg-transparent border-0 cursor-pointer"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontStyle: 'italic', color: activeMenu === 'MARQUES' ? '#E63012' : (isHome && !isScrolled ? '#fff' : '#000') }}
              >
                MARQUES
                <ChevronDown className="w-3 h-3 transition-transform" style={{ color: activeMenu === 'MARQUES' ? '#E63012' : (isHome && !isScrolled ? '#fff' : '#000'), transform: activeMenu === 'MARQUES' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
            </div>
            {/* DESTOCKAGE! */}
            <div className={`relative bg-[#E63012] flex items-center border-r transition-colors ${isHome && !isScrolled ? 'border-white/10' : 'border-gray-300/60'}`}>
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-white text-[8px] font-black px-2 py-0.5 rounded-none whitespace-nowrap z-10 bg-black">
                Jusqu'à -70% !
              </span>
              <Link to="/boutique" className="flex items-center px-4 xl:px-8 py-3.5 text-[12px] xl:text-[14px] text-white uppercase tracking-wide whitespace-nowrap hover:bg-red-700 transition-colors" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontStyle: 'italic' }}>
                DESTOCKAGE !
              </Link>
            </div>
          </nav>
        </div>

        {/* Global megamenu dropdown container */}
        {activeMenu && (
          <div
            className="absolute top-full left-0 right-0 w-full bg-white shadow-2xl border-t-2 z-50 border-[#E63012] py-8 px-6"
            onMouseEnter={() => openMenu(activeMenu)}
            onMouseLeave={closeMenu}
          >
            <div className="max-w-[1650px] mx-auto px-4">
              {activeMenu === 'CASQUES' && (
                <div className="flex gap-8 divide-x divide-gray-100">
                  <div className="flex-[3] pr-4">
                    <h3 className="bg-[#f2f2f2] text-[#222] font-display font-black text-center py-2 text-[10px] tracking-wider uppercase mb-6">NOS TYPES DE CASQUE</h3>
                    <div className="grid grid-cols-4 gap-6">
                      <Link to="/categorie/casques?type=integral" className="flex flex-col items-center group text-center">
                        <span className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-2 group-hover:text-[#E63012] transition-colors">INTEGRAL</span>
                        <div className="w-24 h-24 flex items-center justify-center border border-gray-100 rounded bg-[#fdfdfd] group-hover:border-gray-300 transition-colors p-2">
                          <img src="/header-integral.png" alt="Casque Intégral" className="w-20 h-20 object-contain" />
                        </div>
                      </Link>
                      <Link to="/categorie/casques?type=modulable" className="flex flex-col items-center group text-center">
                        <span className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-2 group-hover:text-[#E63012] transition-colors">MODULABLE</span>
                        <div className="w-24 h-24 flex items-center justify-center border border-gray-100 rounded bg-[#fdfdfd] group-hover:border-gray-300 transition-colors p-2">
                          <img src="/header-modulable.png" alt="Casque Modulable" className="w-20 h-20 object-contain" />
                        </div>
                      </Link>
                      <Link to="/categorie/casques?type=jet" className="flex flex-col items-center group text-center">
                        <span className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-2 group-hover:text-[#E63012] transition-colors">JET</span>
                        <div className="w-24 h-24 flex items-center justify-center border border-gray-100 rounded bg-[#fdfdfd] group-hover:border-gray-300 transition-colors p-2">
                          <img src="/header-jet.png" alt="Casque Jet" className="w-20 h-20 object-contain" />
                        </div>
                      </Link>
                      <Link to="/categorie/casques?type=visiere" className="flex flex-col items-center group text-center">
                        <span className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-2 group-hover:text-[#E63012] transition-colors">VISIÈRE</span>
                        <div className="w-24 h-24 flex items-center justify-center border border-gray-100 rounded bg-[#fdfdfd] group-hover:border-gray-300 transition-colors p-2">
                          <img src="/header-visiere.png" alt="Visière" className="w-20 h-20 object-contain" />
                        </div>
                      </Link>
                    </div>
                  </div>
                  <div className="flex-[2] pl-8">
                    <h3 className="bg-[#f2f2f2] text-[#222] font-display font-black text-center py-2 text-[10px] tracking-wider uppercase mb-6">NOS MARQUES PHARES</h3>
                    <div className="grid grid-cols-3 gap-y-6 gap-x-4 items-center justify-items-center">
                      <Link to="/boutique?brand=agv" className="hover:opacity-85 transition-opacity"><BrandAGV /></Link>
                      <Link to="/boutique?brand=tcx" className="hover:opacity-85 transition-opacity"><BrandTCX /></Link>
                      <Link to="/boutique?brand=givi" className="hover:opacity-85 transition-opacity"><BrandGIVI /></Link>
                      <Link to="/boutique?brand=did" className="hover:opacity-85 transition-opacity"><BrandDID /></Link>
                      <Link to="/boutique?brand=100-percent" className="hover:opacity-85 transition-opacity"><BrandOneHundred /></Link>
                      <Link to="/boutique?brand=akrapovic" className="hover:opacity-85 transition-opacity"><BrandAkrapovic /></Link>
                      <Link to="/boutique?brand=kenny" className="hover:opacity-85 transition-opacity"><BrandKenny /></Link>
                      <Link to="/boutique?brand=fox-racing" className="hover:opacity-85 transition-opacity"><BrandFoxRacing /></Link>
                      <Link to="/boutique?brand=odi" className="hover:opacity-85 transition-opacity"><BrandODI /></Link>
                    </div>
                  </div>
                </div>
              )}

              {activeMenu === 'ÉQUIPEMENTS' && (
                <div className="grid grid-cols-5 gap-8">
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-black"><IconJacket /></div>
                    <h4 className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-4 text-center">BLOUSON ET VESTE</h4>
                    <ul className="space-y-2.5 text-center w-full">
                      <li><Link to="/categorie/vestes-blousons?season=ete" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Veste été</Link></li>
                      <li><Link to="/categorie/vestes-blousons?season=hiver" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Veste hiver</Link></li>
                      <li><Link to="/categorie/vestes-blousons?season=mi-saison" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Veste mi-saison</Link></li>
                      <li><Link to="/categorie/vestes-blousons?type=pluie" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Veste pluie</Link></li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-black"><IconGloves /></div>
                    <h4 className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-4 text-center">GANTS MOTO</h4>
                    <ul className="space-y-2.5 text-center w-full">
                      <li><Link to="/categorie/gants?type=ete" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Gants Moto Été</Link></li>
                      <li><Link to="/categorie/gants?type=mi-saison" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Gants Mi-saison</Link></li>
                      <li><Link to="/categorie/gants?type=hiver" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Gants Hiver</Link></li>
                      <li><Link to="/categorie/gants?type=chauffants" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Gants Chauffants</Link></li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-black"><IconPants /></div>
                    <h4 className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-4 text-center">PANTALON</h4>
                    <ul className="space-y-2.5 text-center w-full">
                      <li><Link to="/categorie/pantalons?type=pluie" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Pantalon Pluie Moto</Link></li>
                      <li><Link to="/categorie/pantalons" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Pantalon Moto</Link></li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-black"><IconBoots /></div>
                    <h4 className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-4 text-center">CHAUSSURES ET BASKETS</h4>
                    <ul className="space-y-2.5 text-center w-full">
                      <li><Link to="/categorie/bottes?type=chaussures" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Chaussures Moto</Link></li>
                      <li><Link to="/categorie/bottes?type=baskets" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Baskets Moto</Link></li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-black"><IconRain /></div>
                    <h4 className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-4 text-center">VETEMENT MOTO PLUIE</h4>
                    <ul className="space-y-2.5 text-center w-full">
                      <li><Link to="/categorie/vestes-blousons?type=pluie" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Veste Pluie</Link></li>
                      <li><Link to="/categorie/pantalons?type=pluie" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Pantalon Pluie</Link></li>
                      <li><Link to="/categorie/protections" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Tour de cou &amp; Cagoule</Link></li>
                      <li><Link to="/categorie/vestes-blousons?type=pluie" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Ensemble de pluie</Link></li>
                    </ul>
                  </div>
                </div>
              )}

              {activeMenu === 'ACCESSOIRES' && (
                <div className="grid grid-cols-5 gap-8">
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-black"><IconLock /></div>
                    <h4 className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-4 text-center">ANTIVOL MOTO &amp; SÉCURITÉ</h4>
                    <ul className="space-y-2.5 text-center w-full">
                      <li><Link to="/categorie/protections" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Antivol U</Link></li>
                      <li><Link to="/categorie/protections" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Antivol Cable</Link></li>
                      <li><Link to="/categorie/protections" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Antivol Homologué SRA</Link></li>
                      <li><Link to="/categorie/protections" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Chaine Antivol</Link></li>
                      <li><Link to="/categorie/protections" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Bloque Disque</Link></li>
                      <li><Link to="/categorie/protections" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Alarme</Link></li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-black"><IconBluetooth /></div>
                    <h4 className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-4 text-center">HIGH-TECH MOTO</h4>
                    <ul className="space-y-2.5 text-center w-full">
                      <li><Link to="/categorie/accessoires-usb" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Intercom Moto &amp; Kit Mains Libre</Link></li>
                      <li><Link to="/categorie/accessoires-usb" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Support pour Mobile</Link></li>
                      <li><Link to="/categorie/accessoires-usb" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Accessoire Electronique Moto</Link></li>
                      <li><Link to="/categorie/accessoires-usb" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> GPS Moto</Link></li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-black"><IconTopcase /></div>
                    <h4 className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-4 text-center">BAGAGERIE POUR MOTO</h4>
                    <ul className="space-y-2.5 text-center w-full">
                      <li><Link to="/categorie/bagagerie" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Support Top-Case</Link></li>
                      <li><Link to="/categorie/bagagerie" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Top-case &amp; Valise latérale</Link></li>
                      <li><Link to="/categorie/sacoches" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Sacoche et Sac à dos moto</Link></li>
                      <li><Link to="/categorie/bagagerie" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Platine Top Case</Link></li>
                      <li><Link to="/categorie/bagagerie" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Support Valise Moto</Link></li>
                      <li><Link to="/categorie/bagagerie" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Crash Bar et Pare-Carter</Link></li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-black"><IconWinter /></div>
                    <h4 className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-4 text-center">ACCESSOIRE FROID ET PLUIE</h4>
                    <ul className="space-y-2.5 text-center w-full">
                      <li><Link to="/boutique" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Tabliers</Link></li>
                      <li><Link to="/boutique" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Poignées &amp; Manchons chauffants</Link></li>
                      <li><Link to="/boutique" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Manchons Scooter et Moto</Link></li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-black"><IconWindshield /></div>
                    <h4 className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-4 text-center">BULLE MOTO</h4>
                    <ul className="space-y-2.5 text-center w-full">
                      <li><Link to="/boutique" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Kit de Fixation et Vis</Link></li>
                    </ul>
                  </div>
                </div>
              )}

              {activeMenu === 'ENTRETIEN' && (
                <div className="grid grid-cols-5 gap-8">
                  <div className="flex flex-col items-center col-span-1">
                    <div className="mb-4 text-black"><IconOil /></div>
                    <h4 className="text-[11px] font-black uppercase text-[#222] tracking-wider mb-4 text-center">HUILE MOTO</h4>
                    <ul className="space-y-2.5 text-center w-full">
                      <li><Link to="/boutique?q=huile+2t" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Huile 2T</Link></li>
                      <li><Link to="/boutique?q=huile+4t" className="text-xs font-bold text-gray-700 hover:text-[#E63012] flex items-center justify-center gap-1"><span>›</span> Huile 4T</Link></li>
                    </ul>
                  </div>
                </div>
              )}

              {activeMenu === 'MARQUES' && (
                <div>
                  <div className="text-center mb-6">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Découvrez nos marques partenaires</p>
                  </div>
                  <div className="grid grid-cols-9 gap-4 items-center justify-items-center">
                    {[
                      { name: 'AGV', slug: 'agv', component: <BrandAGV /> },
                      { name: 'TCX', slug: 'tcx', component: <BrandTCX /> },
                      { name: 'GIVI', slug: 'givi', component: <BrandGIVI /> },
                      { name: 'DID', slug: 'did', component: <BrandDID /> },
                      { name: '100%', slug: '100-percent', component: <BrandOneHundred /> },
                      { name: 'AKRAPOVIC', slug: 'akrapovic', component: <BrandAkrapovic /> },
                      { name: 'KENNY', slug: 'kenny', component: <BrandKenny /> },
                      { name: 'FOX RACING', slug: 'fox-racing', component: <BrandFoxRacing /> },
                      { name: 'ODI', slug: 'odi', component: <BrandODI /> },
                    ].map((brand) => (
                      <Link
                        key={brand.slug}
                        to={`/boutique?brand=${brand.slug}`}
                        className="w-full flex flex-col items-center justify-center p-3 border border-gray-100 rounded hover:border-[#E63012] hover:shadow-md transition-all h-24 bg-white group"
                        onClick={() => setActiveMenu(null)}
                      >
                        <div className="text-gray-500 group-hover:text-[#E63012] transition-colors">
                          {brand.component}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-[#E63012] mt-1 transition-colors">{brand.name}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Link to="/boutique" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#E63012] hover:text-black transition-colors" onClick={() => setActiveMenu(null)}>
                      VOIR TOUS LES PRODUITS MARQUES →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE HEADER BAR ─────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className={`lg:hidden border-b transition-all duration-300 ${isHome && !isScrolled ? 'bg-transparent border-transparent shadow-none' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="flex items-center justify-between px-3 h-14">
          {/* Left: Hamburger */}
          <button
            onClick={() => setMobileNavOpen(!isMobileNavOpen)}
            className="flex flex-col gap-[5px] p-2 -ml-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Menu"
            id="mobile-menu-btn"
          >
            <span className={`block w-5 h-0.5 rounded transition-all duration-300 ${isHome && !isScrolled ? 'bg-white' : 'bg-gray-800'}`} style={isMobileNavOpen ? { transform: 'rotate(45deg) translate(4px, 4px)' } : {}} />
            <span className={`block w-5 h-0.5 rounded transition-all duration-300 ${isHome && !isScrolled ? 'bg-white' : 'bg-gray-800'}`} style={isMobileNavOpen ? { opacity: 0, width: 0 } : {}} />
            <span className={`block w-5 h-0.5 rounded transition-all duration-300 ${isHome && !isScrolled ? 'bg-white' : 'bg-gray-800'}`} style={isMobileNavOpen ? { transform: 'rotate(-45deg) translate(4px, -4px)' } : {}} />
          </button>

          {/* Center: Logo */}
          <Link to="/" className="flex items-center" aria-label="MOTO PACO — Accueil">
            <img src={isHome && !isScrolled ? "/logo-white.png" : "/logo.png"} alt="MOTO PACO" className="h-9 w-auto object-contain" />
          </Link>

          {/* Right: Search + Cart */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${isHome && !isScrolled ? 'text-white' : 'text-gray-700'}`}
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className={`relative p-2 rounded-lg transition-colors ${isHome && !isScrolled ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}
              aria-label="Mon panier"
            >
              <ShoppingCart className={`w-5 h-5 ${isHome && !isScrolled ? 'text-white' : 'text-[#E63012]'}`} />

              {cartQty > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#E63012] text-white text-[9px] font-black flex items-center justify-center">
                  {cartQty}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Expand */}
        {mobileSearchOpen && (
          <div ref={mobileSearchRef} className="border-t border-gray-100 px-3 py-2 bg-white">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); }}
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#E63012] transition-colors bg-gray-50"
                />
              </div>
              <button type="submit" className="bg-[#E63012] text-white px-4 rounded-lg font-bold text-sm flex-shrink-0">
                OK
              </button>
            </form>
            {searchQuery.trim() && (
              <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-[60vh] overflow-y-auto">
                {searchDropdown}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile nav slide-out panel ─────────────────────────── */}
      {isMobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-white w-[85%] max-w-sm h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E63012]/20" style={{ backgroundColor: '#E63012' }}>
              <Link to="/" onClick={() => setMobileNavOpen(false)}>
                <img src="/logo.png" alt="MOTO PACO" className="h-8 w-auto object-contain brightness-0 invert" />
              </Link>
              <button onClick={() => setMobileNavOpen(false)} className="text-white p-1 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DESTOCKAGE CTA Banner */}
            <Link
              to="/boutique"
              onClick={() => setMobileNavOpen(false)}
              className="mx-4 mt-4 rounded-xl bg-black text-white flex items-center justify-between px-4 py-3 hover:bg-gray-900 transition-colors group"
            >
              <div>
                <span className="text-[10px] text-[#E63012] font-black uppercase tracking-widest">Offre limitée</span>
                <div className="text-sm font-black uppercase tracking-wide">DESTOCKAGE — Jusqu'à -70%</div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#E63012] group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Navigation Links with Accordions */}
            <nav className="flex-1 py-3 px-2">
              {megaMenuData.map(item => (
                <div key={item.label} className="mb-1">
                  {/* Category header row */}
                  <button
                    className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedMobileMenu(expandedMobileMenu === item.label ? null : item.label)}
                  >
                    <span className="text-[13px] font-black uppercase tracking-wider text-gray-900">{item.label}</span>
                    <ChevronDown
                      className="w-4 h-4 text-gray-400 transition-transform duration-200"
                      style={{ transform: expandedMobileMenu === item.label ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {/* Subcategory links */}
                  {expandedMobileMenu === item.label && (
                    <div className="ml-3 pl-3 border-l-2 border-[#E63012]/20 mb-2">
                      {item.submenu?.flatMap(s => s.items).map(sub => (
                        <Link
                          key={sub.label}
                          to={sub.href}
                          className="flex items-center gap-2 py-2 px-2 text-[12px] text-gray-600 hover:text-[#E63012] transition-colors rounded-lg hover:bg-red-50 font-medium"
                          onClick={() => setMobileNavOpen(false)}
                        >
                          <span className="text-[#E63012] text-xs">›</span>
                          {sub.label}
                        </Link>
                      ))}
                      <Link
                        to={item.href}
                        className="flex items-center gap-2 py-2 px-2 text-[11px] text-[#E63012] hover:underline font-black uppercase tracking-wider mt-1"
                        onClick={() => setMobileNavOpen(false)}
                      >
                        Voir tout {item.label} →
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Quick category shortcuts */}
            <div className="px-4 pb-3 border-t border-gray-100 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">ACCÈS RAPIDE</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Casques', href: '/categorie/casques', emoji: '🏍️' },
                  { label: 'Gants', href: '/categorie/gants', emoji: '🧤' },
                  { label: 'Bottes', href: '/categorie/bottes', emoji: '👟' },
                  { label: 'Vestes', href: '/categorie/vestes-blousons', emoji: '🧥' },
                  { label: 'Bagagerie', href: '/categorie/bagagerie', emoji: '🎒' },
                  { label: 'Boutique', href: '/boutique', emoji: '🛒' },
                ].map(c => (
                  <Link
                    key={c.label}
                    to={c.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="flex flex-col items-center gap-1 p-2 border border-gray-100 rounded-xl hover:border-[#E63012]/30 hover:bg-red-50 transition-colors text-center"
                  >
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">{c.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Panel Footer */}
            <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-2">
              <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : '/compte'}
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white transition-colors border border-gray-100"
              >
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-bold text-gray-700">Mon Compte</span>
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white transition-colors border border-gray-100"
              >
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-bold text-gray-700">Aide &amp; Contact</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
