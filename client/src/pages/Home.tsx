import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, Star, Plus, Minus, Truck, RotateCcw, ShieldCheck, CreditCard,
  ArrowRight, Package, MapPin
} from 'lucide-react';
import api from '../lib/api.ts';
import { Product } from '../types/product.ts';
import ProductCard from '../components/product/ProductCard.tsx';
import SEOHead from '../components/seo/SEOHead.tsx';
import InstagramFeed from '../components/layout/InstagramFeed.tsx';

/* ─── Category inline SVGs ───────────────────────────────────── */
const categoryIcons = {
  Bagagerie: '/categories/ICONE-GLOBAL-Topcase.svg',
  CASQUES: () => (
    <svg className="w-7 h-7 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22 C17.5 22 21 17 21 12 C21 5.5 17.5 2 12 2 C6.5 2 3 5.5 3 12 C3 17 6.5 22 12 22 Z" />
      <path d="M7 13 C11 11 15 11 19 13 C19 15 17 18 12 18 C7 18 5 15 5 13" fill="#efefef" />
    </svg>
  ),
  Gants: '/categories/ICONE-GLOBAL-Gants.svg',
  Bottes: '/categories/ICONE-GLOBAL-Chaussures.svg',
  JACKETS: '/categories/ICONE-GLOBAL-Vestes.svg',
  OFFROAD: '/categories/ICONE-GLOBAL-Poignee.svg',
  'Sac à dos': '/categories/ICONE-GLOBAL-Topcase.svg',
  'CRASH BARS': '/categories/ICONE-GLOBAL-Antivol.svg',
  'Protection Moteur & Cadre': '/categories/PM-Menu-icone-bullemoto.svg',
  'Support pour téléphone portable': '/categories/ICONE-GLOBAL-Bluetooth.svg',
  'Support valises': '/categories/ICONE-GLOBAL-Topcase.svg',
  Pneus: () => (
    <svg className="w-7 h-7 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 3 V7 M12 17 V21 M3 12 H7 M17 12 H21" />
    </svg>
  )
};

const homeCategoryMappings = [
  { key: 'Bagagerie', iconKey: 'Bagagerie', targetSlug: 'bagagerie-moto', displayName: 'Bagagerie' },
  { key: 'CASQUES', iconKey: 'CASQUES', targetSlug: 'casques-moto', displayName: 'CASQUES' },
  { key: 'Gants', iconKey: 'Gants', targetSlug: 'gants-moto', displayName: 'Gants' },
  { key: 'Bottes', iconKey: 'Bottes', targetSlug: 'bottes-moto', displayName: 'Bottes' },
  { key: 'JACKETS', iconKey: 'JACKETS', targetSlug: 'jackets', displayName: 'JACKETS' },
  { key: 'OFFROAD', iconKey: 'OFFROAD', targetSlug: 'offroad', displayName: 'OFFROAD' },
  { key: 'Sac', iconKey: 'Sac à dos', targetSlug: 'sac', displayName: 'Sac à dos' },
  { key: 'CRASH BARS', iconKey: 'CRASH BARS', targetSlug: 'crash-bars', displayName: 'CRASH BARS' },
  { key: 'Protection Moteur & Cadre', iconKey: 'Protection Moteur & Cadre', targetSlug: 'protection-moteur-cadre', displayName: 'Protection Moteur & Cadre' },
  { key: 'Support pour téléphone portable', iconKey: 'Support pour téléphone portable', targetSlug: 'support-pour-telephone-portable', displayName: 'Support pour téléphone portable' },
  { key: 'Support valises', iconKey: 'Support valises', targetSlug: 'support-valises', displayName: 'Support valises' },
  { key: 'Pneus', iconKey: 'Pneus', targetSlug: 'pneus', displayName: 'Pneus' }
];

/* ─── Brand inline SVGs ──────────────────────────────────────── */
const brandSVGs = {
  AGV: () => (
    <svg viewBox="0 0 100 45" className="h-9 w-auto">
      <path d="M15 5 C15 5, 50 2, 85 5 C85 25, 75 40, 50 43 C25 40, 15 25, 15 5 Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <text x="50" y="28" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="19" fontStyle="italic" textAnchor="middle" fill="currentColor">AGV</text>
    </svg>
  ),
  TCX: () => (
    <svg viewBox="0 0 100 45" className="h-9 w-auto">
      <text x="50" y="25" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="23" fontStyle="italic" textAnchor="middle" fill="currentColor">TCX</text>
      <path d="M20 30 L80 30" stroke="#E63012" strokeWidth="2.5" />
      <text x="50" y="38" fontFamily="sans-serif" fontSize="5" fontWeight="black" textAnchor="middle" fill="currentColor" letterSpacing="1">FOCUS ON BOOTS</text>
    </svg>
  ),
  GIVI: () => (
    <svg viewBox="0 0 100 45" className="h-9 w-auto">
      <rect x="5" y="6" width="90" height="33" rx="3" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <text x="50" y="30" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="21" textAnchor="middle" fill="currentColor" letterSpacing="1">GIVI</text>
    </svg>
  ),
  DID: () => (
    <svg viewBox="0 0 100 45" className="h-9 w-auto">
      <path d="M15 22.5 H85" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.1" />
      <text x="50" y="30" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="23" textAnchor="middle" fill="currentColor" letterSpacing="0.5">D.I.D</text>
    </svg>
  ),
  '100%': () => (
    <svg viewBox="0 0 100 45" className="h-9 w-auto">
      <polygon points="20,12 50,4 80,12 80,33 50,41 20,33" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <text x="50" y="27" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="16" textAnchor="middle" fill="currentColor">100%</text>
    </svg>
  ),
  AKRAPOVIC: () => (
    <svg viewBox="0 0 100 45" className="h-9 w-auto">
      <text x="50" y="24" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="13" textAnchor="middle" fill="currentColor" letterSpacing="0.5">AKRAPOVIC</text>
      <path d="M15 30 Q50 35 85 30" stroke="#E63012" strokeWidth="2" fill="none" />
    </svg>
  ),
  KENNY: () => (
    <svg viewBox="0 0 100 45" className="h-9 w-auto">
      <text x="50" y="29" fontFamily="'Montserrat', sans-serif" fontWeight="950" fontSize="20" fontStyle="italic" textAnchor="middle" fill="currentColor" letterSpacing="0.5">KENNY</text>
    </svg>
  ),
  'FOX RACING': () => (
    <svg viewBox="0 0 100 45" className="h-9 w-auto" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M50 8 L32 20 L38 23 L25 32 L44 32 L50 38 L56 32 L75 32 L62 23 L68 20 Z" fill="currentColor" />
      <circle cx="43" cy="24" r="1.5" fill="white" stroke="none" />
      <circle cx="57" cy="24" r="1.5" fill="white" stroke="none" />
    </svg>
  ),
  ODI: () => (
    <svg viewBox="0 0 100 45" className="h-9 w-auto">
      <text x="50" y="29" fontFamily="'Montserrat', sans-serif" fontWeight="900" fontSize="24" textAnchor="middle" fill="currentColor" letterSpacing="1">ODI</text>
    </svg>
  )
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bestsellers' | 'new'>('bestsellers');
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [bagageriePromos, setBagageriePromos] = useState<Product[]>([]);
  const [bagagerieFeatured, setBagagerieFeatured] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const moroccanReviews = [
    { name: 'Hamza B.', city: 'Casablanca', text: "Super service ! Casque AGV K6 reçu en 24h à Casablanca. Taille parfaite et emballage très soigné. Je commande chez Moto Paco depuis 2 ans et je n'ai jamais été déçu !", rating: 5 },
    { name: 'Tarik A.', city: 'Rabat', text: "Ligne Akrapovic commandée pour mon Tmax 560. Le son est absolument magnifique et la livraison était ultra rapide. Moto Paco est clairement la référence au Maroc !", rating: 5 },
    { name: 'Sarah L.', city: 'Fès', text: "Très satisfaite de mon blouson Alpinestars femme. L'échange de taille était super rapide et entièrement gratuit. L'équipe est professionnelle, à l'écoute et vraiment sympa.", rating: 5 },
    { name: 'Amine M.', city: 'Tanger', text: "J'ai commandé un top case Givi E55 avec platine. Très bien conseillé par téléphone pour choisir la bonne platine pour mon Africa Twin. Livraison en 48h et paiement à la réception, parfait !", rating: 5 },
    { name: 'Youssef K.', city: 'Marrakech', text: "Excellent rapport qualité/prix sur les gants Dainese Airfast. Les produits sont authentiques avec garantie constructeur. Le service client répond même le week-end sur WhatsApp, chapeau !", rating: 5 },
    { name: 'Mehdi O.', city: 'Agadir', text: "Le meilleur shop moto du Maroc sans hésiter ! Large choix de marques officielles, les prix sont imbattables et la livraison est rapide même à Agadir. Mon shop préféré !", rating: 5 },
    { name: 'Rachid F.', city: 'Salé', text: "J'ai acheté un kit chaîne DID pour ma CB650R. Prix correct, livraison le lendemain. L'article est bien emballé et conforme à la description. Je reviendrai certainement !", rating: 5 },
    { name: 'Nadia B.', city: 'Oujda', text: "Première commande chez Moto Paco : bottes TCX reçues en 3 jours à Oujda ! La pointure correspond bien au guide des tailles sur le site. Très bonne expérience, je recommande vivement.", rating: 5 },
    { name: 'Omar S.', city: 'Kénitra', text: "Support top case GIVI monté sur ma R1250GS. Montage parfait avec le tutoriel envoyé par l'équipe. Sérieux, rapide et professionnel. C'est ma 4ème commande !", rating: 5 },
    { name: 'Ilias H.', city: 'Meknès', text: "Casque modulable Shark Evo-One 2 reçu bien emballé avec une housse de transport. Le produit est identique aux photos. 5 étoiles mérité, la meilleure boutique moto en ligne au Maroc !", rating: 5 },
  ];  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const [newRes, featRes, settingsRes, catRes, bagagerieRes, bagSplitRes] = await Promise.all([
          api.get('/products/new-arrivals'),
          api.get('/products/featured'),
          api.get('/settings'),
          api.get('/categories'),
          api.get('/products?promotions=true&limit=5'),
          api.get('/products?category=bagagerie-moto&limit=2')
        ]);
        setNewArrivals(newRes.data || []);
        setFeatured(featRes.data || []);
        setSettings(settingsRes.data || {});
        setBagageriePromos(bagagerieRes.data?.products || []);
        setBagagerieFeatured(bagSplitRes.data?.products || []);
        
        const allCats = catRes.data || [];
        
        // Helper to flatten categories (both parent and children)
        interface FlatCat {
          id: number;
          name: string;
          slug: string;
          parent_id: number | null;
          product_count: number;
        }
        
        const flattenCategories = (cats: any[]): FlatCat[] => {
          let flat: FlatCat[] = [];
          cats.forEach(c => {
            const count = c.total_products !== undefined ? c.total_products : (c.product_count || 0);
            flat.push({
              id: c.id,
              name: c.name,
              slug: c.slug,
              parent_id: c.parent_id,
              product_count: count
            });
            if (c.subcategories && c.subcategories.length > 0) {
              flat = [...flat, ...flattenCategories(c.subcategories)];
            }
          });
          return flat;
        };

        const flatCats = flattenCategories(allCats);

        // Map categories dynamically based on homeCategoryMappings
        const mapped = homeCategoryMappings.map(mapping => {
          const matched = flatCats.find(c => c.slug === mapping.targetSlug || c.name.toLowerCase() === mapping.key.toLowerCase());
          return {
            name: mapping.displayName,
            count: matched ? matched.product_count : 0,
            slug: matched?.slug || mapping.targetSlug,
            iconKey: mapping.iconKey
          };
        });

        setDynamicCategories(mapped);
      } catch (err) {
        console.error('Error fetching home products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) { setSubscribed(true); setEmail(''); }
  };



  const faqItems = [
    {
      q: "Des prix bas toute l'année sur l'équipement motard ?",
      a: "Chez MOTO PACO, nous travaillons en direct avec les plus grands équipementiers mondiaux (Arai, Shoei, Dainese, Alpinestars) pour vous proposer les meilleurs tarifs. Notre force réside dans la négociation de volumes importants afin de répercuter ces économies sur vos achats. De plus, notre service DESTOCKAGE vous permet de profiter de remises exceptionnelles allant jusqu'à -70% sur des produits de grande marque."
    },
    {
      q: "Que se passe-t-il si la taille de mon équipement ne convient pas ?",
      a: "Nous offrons des retours et échanges simplifiés sous 30 jours. Si la taille de votre casque, veste ou paire de gants ne convient pas, contactez-nous par email ou téléphone. Notre équipe organisera le retour et l'envoi du bon article. Consultez notre guide des tailles disponible sur chaque fiche produit pour choisir la bonne taille dès le départ."
    },
    {
      q: "Quels sont les délais et tarifs de livraison ?",
      a: "Les commandes passées avant 14h sont expédiées le jour même. La livraison standard est au tarif de 40 DH, et elle est offerte à partir de 2000 DH d'achat partout au Maroc."
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <SEOHead
        title="Accessoire Moto et Équipement Motard : Style & Sécurité | MOTO PACO"
        description="Découvrez notre sélection d'accessoires et équipements moto de quality au Maroc. Blousons, gants, casques, pantalons pour une conduite sécurisée."
        schema={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "MOTO PACO",
          "url": "https://packmoto.com",
          "sameAs": ["https://instagram.com/packmoto", "https://facebook.com/packmoto"]
        }}
      />

      {/* ===== HERO BANNER WITH VIDEO BACKGROUND ===== */}
      <section className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[80vh] min-h-[420px] bg-black overflow-hidden flex items-end justify-center pb-12 sm:pb-16 lg:pb-20 -mt-[56px] lg:-mt-[132px]">
        {/* Background Video Wrapper */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none bg-[#0a0a0a]">
          {/* Thumbnail Layer */}
          <div 
            className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ${isVideoLoaded ? 'opacity-0' : 'opacity-60'}`}
            style={{ backgroundImage: 'url(/video-thumbnail.jpg)' }}
          />
          <iframe
            src="https://www.youtube.com/embed/9SBy1sAlAhs?autoplay=1&mute=1&loop=1&playlist=9SBy1sAlAhs&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&vq=hd1080"
            className={`absolute top-1/2 left-1/2 w-[177.78vh] h-[56.25vw] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 ${isVideoLoaded ? 'opacity-60' : 'opacity-0'}`}
            allow="autoplay; encrypted-media"
            title="Moto Paco Promo Video"
            frameBorder="0"
            onLoad={() => setIsVideoLoaded(true)}
          />
        </div>
        
        {/* Sleek Dark Gradient Overlay (Transparent at top to show full video action) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

        {/* Dynamic & Premium Overlay Content (Aligned to the bottom of the viewport) */}
        <div className="relative z-20 max-w-[1200px] px-6 text-center text-white flex flex-col items-center">
          <span 
            className="text-[#E63012] font-mono text-xs sm:text-sm font-black tracking-[0.25em] uppercase mb-2 animate-pulse"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            L'EXCELLENCE MOTARDE AU MAROC
          </span>
          <h1 
            className="text-3xl sm:text-5xl lg:text-6xl font-black italic tracking-wide uppercase text-white mb-4 leading-tight drop-shadow-lg"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            MOTO PACO
          </h1>
          <p className="text-gray-300 text-xs sm:text-base max-w-xl mb-6 leading-relaxed font-medium">
            Découvrez le plus grand choix d'équipements de marque, d'accessoires moto et de protections certifiées au meilleur prix.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/boutique"
              className="bg-[#E63012] hover:bg-red-700 text-white font-black text-[11px] sm:text-xs uppercase tracking-widest px-8 py-4 rounded-none transition-all duration-300 shadow-[0_4px_20px_rgba(230,48,18,0.4)] hover:shadow-[0_4px_30px_rgba(230,48,18,0.6)] transform hover:-translate-y-0.5"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              DÉCOUVRIR LA BOUTIQUE
            </Link>
            <Link
              to="/boutique?search=destockage"
              className="bg-transparent hover:bg-white/10 text-white border-2 border-white hover:border-[#E63012] font-black text-[11px] sm:text-xs uppercase tracking-widest px-8 py-4 rounded-none transition-all duration-300 transform hover:-translate-y-0.5"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              NOS PROMOS DESTOCKAGE
            </Link>
          </div>
        </div>
      </section>

      {/* ===== PROMO CATEGORY BANNERS GRID ===== */}
      <section className="bg-white pt-8 pb-4">
        <div className="max-w-[1650px] mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Casques Banner */}
            <Link to="/categorie/casques-moto" className="relative block overflow-hidden rounded-xl bg-black group h-36 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <img src="/uploads/cat-casques.png" alt="Casques Promo" className="absolute right-0 top-0 h-full w-[65%] object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent z-10"></div>
              <div className="absolute left-0 top-0 h-full w-[55%] bg-[#1c1c1c] z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}></div>
              <div className="relative z-20 p-5 flex flex-col justify-between h-full w-[55%]">
                <div className="space-y-1">
                  <h3 className="font-display font-black text-lg italic text-white uppercase tracking-wider">CASQUES</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[9px] text-gray-400 font-extrabold tracking-wider">JUSQU'À</span>
                    <span className="text-2xl font-black text-[#E63012] italic tracking-wide">-50%</span>
                  </div>
                </div>
                <div className="flex items-center text-white text-[9px] font-black uppercase tracking-widest gap-1 group-hover:text-[#E63012] transition-colors mt-2">
                  DÉCOUVRIR <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Vestes Banner */}
            <Link to="/categorie/jackets" className="relative block overflow-hidden rounded-xl bg-black group h-36 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <img src="/uploads/cat-vestes.png" alt="Vestes Promo" className="absolute right-0 top-0 h-full w-[65%] object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent z-10"></div>
              <div className="absolute left-0 top-0 h-full w-[55%] bg-[#1c1c1c] z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}></div>
              <div className="relative z-20 p-5 flex flex-col justify-between h-full w-[55%]">
                <div className="space-y-1">
                  <h3 className="font-display font-black text-lg italic text-white uppercase tracking-wider">VESTES</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[9px] text-gray-400 font-extrabold tracking-wider">JUSQU'À</span>
                    <span className="text-2xl font-black text-[#E63012] italic tracking-wide">-60%</span>
                  </div>
                </div>
                <div className="flex items-center text-white text-[9px] font-black uppercase tracking-widest gap-1 group-hover:text-[#E63012] transition-colors mt-2">
                  DÉCOUVRIR <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Gants Banner */}
            <Link to="/categorie/gants-moto" className="relative block overflow-hidden rounded-xl bg-black group h-36 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <img src="/uploads/cat-gants.png" alt="Gants Promo" className="absolute right-0 top-0 h-full w-[65%] object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent z-10"></div>
              <div className="absolute left-0 top-0 h-full w-[55%] bg-[#1c1c1c] z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}></div>
              <div className="relative z-20 p-5 flex flex-col justify-between h-full w-[55%]">
                <div className="space-y-1">
                  <h3 className="font-display font-black text-lg italic text-white uppercase tracking-wider">GANTS</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[9px] text-gray-400 font-extrabold tracking-wider">JUSQU'À</span>
                    <span className="text-2xl font-black text-[#E63012] italic tracking-wide">-40%</span>
                  </div>
                </div>
                <div className="flex items-center text-white text-[9px] font-black uppercase tracking-widest gap-1 group-hover:text-[#E63012] transition-colors mt-2">
                  DÉCOUVRIR <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Antivols Banner */}
            <Link to="/boutique?search=antivol" className="relative block overflow-hidden rounded-xl bg-black group h-36 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <img src="/uploads/cat-antivols.png" alt="Antivols Promo" className="absolute right-0 top-0 h-full w-[65%] object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent z-10"></div>
              <div className="absolute left-0 top-0 h-full w-[55%] bg-[#1c1c1c] z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}></div>
              <div className="relative z-20 p-5 flex flex-col justify-between h-full w-[55%]">
                <div className="space-y-1">
                  <h3 className="font-display font-black text-lg italic text-white uppercase tracking-wider">ANTIVOLS</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[9px] text-gray-400 font-extrabold tracking-wider">JUSQU'À</span>
                    <span className="text-2xl font-black text-[#E63012] italic tracking-wide">-30%</span>
                  </div>
                </div>
                <div className="flex items-center text-white text-[9px] font-black uppercase tracking-widest gap-1 group-hover:text-[#E63012] transition-colors mt-2">
                  DÉCOUVRIR <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ===== NOS CATÉGORIES PHARES ===== */}
      <section className="bg-white py-8 sm:py-10">
        <div className="max-w-[1650px] mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="flex-1 h-px bg-gray-300 hidden sm:block"></div>
            <div className="w-1 h-[22px] bg-[#E63012] ml-4 mr-3 hidden sm:block"></div>
            <h2 className="section-title text-center">NOS CATÉGORIES PHARES</h2>
            <div className="w-1 h-[22px] bg-[#E63012] ml-3 mr-4 hidden sm:block"></div>
            <div className="flex-1 h-px bg-gray-300 hidden sm:block"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {dynamicCategories.map((cat) => {
              const iconObj = categoryIcons[cat.iconKey as keyof typeof categoryIcons];
              const IconComponent = typeof iconObj === 'function' ? iconObj : null;
              const linkTo = `/categorie/${cat.slug}`;

              return (
                <Link
                  key={cat.name}
                  to={linkTo}
                  className="flex items-center gap-4 bg-white border border-gray-100 hover:border-[#E63012]/30 p-3.5 rounded-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#F9FAFB] border border-gray-100/80 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 group-hover:bg-red-50/30 transition-all duration-300">
                    {typeof iconObj === 'string' ? (
                      <img src={iconObj} alt={cat.name} className="w-7 h-7 object-contain" />
                    ) : IconComponent ? (
                      <IconComponent />
                    ) : null}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className="text-[11px] sm:text-[12px] font-black text-gray-900 uppercase tracking-wide group-hover:text-[#E63012] transition-colors"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {cat.name}
                    </span>
                    <span className="inline-block self-start text-[8px] font-bold text-[#E63012] bg-[#E63012]/5 px-2 py-0.5 rounded-full font-mono mt-0.5 uppercase tracking-wider">
                      {cat.count} ARTICLES
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== TOP VENTES / NOUVEAUTÉS TABS ===== */}
      <section className="bg-white py-4 mb-4">
        <div className="max-w-[1650px] mx-auto px-3 sm:px-4">
          
          {/* Section Header: Tabs — mobile: stacked centered, desktop: full divider */}
          <div className="mb-6 sm:mb-8">
            {/* Mobile Tab Bar */}
            <div className="flex justify-center gap-2 sm:hidden mb-0">
              <button
                onClick={() => setActiveTab('bestsellers')}
                className={`flex-1 py-3 text-[13px] font-black uppercase italic tracking-wide transition-all border-b-2 ${
                  activeTab === 'bestsellers' ? 'text-[#111] border-[#E63012]' : 'text-gray-400 border-transparent'
                }`}
              >
                TOP VENTES
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`flex-1 py-3 text-[13px] font-black uppercase italic tracking-wide transition-all border-b-2 ${
                  activeTab === 'new' ? 'text-[#111] border-[#E63012]' : 'text-gray-400 border-transparent'
                }`}
              >
                NOUVEAUTÉS
              </button>
            </div>
            {/* Desktop Full Header with dividers */}
            <div className="hidden sm:flex items-center justify-center overflow-hidden">
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="w-1 h-[22px] bg-[#E63012] ml-4 mr-3"></div>
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('bestsellers')}
                  className={`text-[17px] font-black uppercase italic tracking-wide transition-all relative pb-1 ${
                    activeTab === 'bestsellers' ? 'text-[#111]' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  TOP VENTES
                  {activeTab === 'bestsellers' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#E63012]" />}
                </button>
                <button
                  onClick={() => setActiveTab('new')}
                  className={`text-[17px] font-black uppercase italic tracking-wide transition-all relative pb-1 ${
                    activeTab === 'new' ? 'text-[#111]' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  LES NOUVEAUTÉS
                  {activeTab === 'new' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#E63012]" />}
                </button>
              </div>
              <div className="w-1 h-[22px] bg-[#E63012] ml-3 mr-4"></div>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {(activeTab === 'bestsellers' ? featured : newArrivals).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-6 sm:mt-8 mb-4">
            <Link
              to="/boutique"
              className="inline-flex items-center justify-center bg-black hover:bg-gray-900 text-white font-black text-[11px] uppercase tracking-wider px-6 sm:px-8 py-3 sm:py-3.5 transition-colors w-full sm:w-auto"
            >
              VOIR LES SUPERS PROMOS
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TOP-CASES & BAGAGES PREMIUM SPLIT BANNER ===== */}
      <section className="w-full bg-[#fcfcfc] overflow-hidden my-12 max-w-[1650px] mx-auto border border-gray-100 rounded-2xl shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch min-h-[500px]">
          {/* Left: Info and products */}
          <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-center items-center bg-white">
            <div className="text-center mb-8">
              <span className="bg-[#E63012]/10 text-[#E63012] font-mono text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                Équipement Premium
              </span>
              <h2 className="text-[17px] font-medium text-gray-800 uppercase tracking-tight mt-3">
                LA SÉLECTION DES
              </h2>
              <h3 className="text-2xl sm:text-3xl font-black text-[#E63012] uppercase italic tracking-wide mt-1">
                TOP-CASES & BAGAGES
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-8">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded h-64 animate-pulse border border-gray-100" />
                ))
              ) : (
                (bagagerieFeatured.length >= 2 ? bagagerieFeatured : featured.slice(0, 2)).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>

            <Link
              to="/boutique?category=bagagerie"
              className="inline-flex items-center justify-center bg-black hover:bg-[#E63012] text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded transition-all hover:scale-105 shadow-md"
            >
              VOIR LA SÉLECTION <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Right: The Image with dynamic aspect ratios */}
          <div className="w-full lg:w-1/2 relative min-h-[300px] lg:min-h-0 bg-gray-100 overflow-hidden">
            <img
              src="/uploads/topcase-showcase.png"
              alt="Top Cases & Bagages"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              loading="lazy"
            />
            {/* Subtle gradient overlay to make the image fit nicely */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-white/10" />
          </div>
        </div>
      </section>

      {/* ===== PROMOTIONS MOTO ===== */}
      {bagageriePromos.length > 0 && (
        <section className="bg-white py-12 max-w-[1650px] mx-auto px-3 sm:px-4 border-t border-gray-100">
          <div className="flex items-center justify-center mb-8">
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="w-1 h-[22px] bg-[#E63012] ml-4 mr-3"></div>
            <h2 className="section-title text-center">SUPER PROMOTIONS</h2>
            <div className="w-1 h-[22px] bg-[#E63012] ml-3 mr-4"></div>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {bagageriePromos.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              to="/boutique?promotions=true"
              className="inline-flex items-center justify-center bg-black hover:bg-[#E63012] text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded transition-all hover:scale-105 shadow-md"
            >
              VOIR TOUTES LES PROMOTIONS <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </section>
      )}

      {/* ===== VOS MARQUES PRÉFÉRÉES ===== */}
      <section className="py-12 bg-white">
        <div className="max-w-[1650px] mx-auto px-4">
          <div className="flex items-center justify-center mb-10 overflow-hidden">
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="w-1 h-[22px] bg-[#E63012] ml-4 mr-3"></div>
            <h2 className="section-title whitespace-nowrap">VOS MARQUES PRÉFÉRÉES</h2>
            <div className="w-1 h-[22px] bg-[#E63012] ml-3 mr-4"></div>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Dynamic brand logo grid with hover effect */}
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3.5 items-center justify-items-center">
            {Object.entries(brandSVGs).map(([name, LogoComponent]) => {
              const slug = name === '100%' ? '100-percent' : name.toLowerCase().replace(/\s+/g, '-');
              return (
                <Link
                  key={name}
                  to={`/boutique?brand=${slug}`}
                  className="w-full flex flex-col items-center justify-center p-4 border border-gray-200/60 rounded-xl hover:border-[#E63012] hover:shadow-xl hover:-translate-y-1 group transition-all duration-300 h-24 bg-[#F9FAFB]/40 hover:bg-white"
                >
                  <div className="text-gray-400 group-hover:text-[#E63012] transition-all duration-300 transform group-hover:scale-105 mb-1 flex items-center justify-center">
                    <LogoComponent />
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400 group-hover:text-[#111] transition-colors">{name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== INSTAGRAM SHOWCASE SECTION ===== */}
      <InstagramFeed />

      {/* ===== FAQ SECTION ===== */}
      <section className="py-10 bg-[#f8f9fa] border-b border-gray-200">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-[#E63012]" />
              <h2 className="section-title">VOS QUESTIONS FRÉQUENTES</h2>
              <div className="h-px w-16 bg-[#E63012]" />
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqItems.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className={`bg-white border transition-colors duration-300 rounded-lg overflow-hidden ${isOpen ? 'border-red-500 shadow-md' : 'border-gray-200 hover:border-gray-300 shadow-sm'}`}>
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex justify-between items-center px-6 py-4 text-left text-sm font-bold text-gray-800 hover:text-red-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <div className="bg-red-100 p-1 rounded-full"><Minus className="w-4 h-4 text-red-600" /></div>
                    ) : (
                      <div className="bg-gray-100 p-1 rounded-full"><Plus className="w-4 h-4 text-gray-500" /></div>
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== BOUTIQUE BANNER ===== */}
      <section className="w-full bg-[#000] text-white flex flex-col md:flex-row items-stretch border-y-4 border-[#E63012] my-6 sm:my-8 max-w-[1650px] mx-auto">
        {/* Left: Storefront — hidden on mobile, shown on md+ */}
        <div className="hidden md:block w-full md:w-[35%] relative">
          <img src="/magasin-front.jpg" alt="Moto Paco Storefront" className="absolute inset-0 w-full h-full object-cover" />
          {/* Custom logo overlay */}
          <div className="absolute top-8 left-8 bg-[#111] p-4 flex flex-col items-center justify-center shadow-2xl rounded-sm w-[60%] max-w-[280px] border-t-[6px] border-[#E63012]">
            <div className="bg-white px-6 py-2 rounded mb-3 shadow-inner w-full flex justify-center">
              <img src="/logo.png" alt="Moto Paco" className="h-12 w-auto object-contain" />
            </div>
            <div className="flex justify-between w-full text-[10px] text-white font-bold px-2">
              <div className="flex flex-col items-center"><span className="text-xl mb-1">🏍️</span><span>CASQUES</span></div>
              <div className="flex flex-col items-center"><span className="text-xl mb-1">🧤</span><span>GANTS</span></div>
              <div className="flex flex-col items-center"><span className="text-xl mb-1">🧥</span><span>BLOUSONS</span></div>
            </div>
            <div className="bg-[#E63012] text-white text-[10px] font-black w-full text-center mt-3 py-1.5 uppercase tracking-wider">Tout l'équipement motard</div>
          </div>
        </div>
        
        {/* Center: Info */}
        <div className="w-full md:w-[45%] py-8 sm:py-12 px-4 sm:px-6 flex flex-col items-center justify-center text-center relative z-10 bg-black">
          <h2 className="section-title mb-2 text-center">
            DÉCOUVREZ NOTRE BOUTIQUE<br/>AU MAROC
          </h2>
          
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <MapPin className="w-4 h-4 text-[#E63012] flex-shrink-0" />
            <p className="text-[11px] text-gray-300 text-left">
              Moto paco, Lotissement assaada n92 et ain atiq temara, Ain atiq 12000
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-6 w-full">
            <div className="text-[#E63012] shrink-0">
              <Package className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm text-white">Le plus grand choix !</p>
              <p className="text-[11px] text-gray-400 max-w-[200px]">Avec toujours plus d'équipements, plus de marques et plus de services.</p>
            </div>
          </div>

          {/* Features Highlights Row */}
          <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-mono font-bold tracking-wider text-gray-300 uppercase mb-8 border-t border-gray-900 pt-6">
            <span className="flex items-center gap-1">🏪 SHOWROOM 150M²</span>
            <span className="text-[#E63012]">•</span>
            <span className="flex items-center gap-1">🏍️ ESSAYAGE & CONSEILS</span>
            <span className="text-[#E63012]">•</span>
            <span className="flex items-center gap-1">🅿️ PARKING MOTARD GRATUIT</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full justify-center">
            <Link to="/contact" className="bg-white text-black text-[11px] font-black px-6 py-3 uppercase hover:bg-gray-200 transition-colors text-center">QUI SOMMES-NOUS ?</Link>
            <a href="https://maps.app.goo.gl/qJzZKZQ61TWeu9hEA" target="_blank" rel="noreferrer" className="bg-white text-black text-[11px] font-black px-6 py-3 uppercase hover:bg-gray-200 transition-colors text-center">ITINÉRAIRE BOUTIQUE</a>
          </div>
        </div>

        {/* Right: Map */}
        <div className="w-full md:w-[20%] h-56 sm:h-64 md:h-auto relative">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3803.721130570378!2d-6.9692704!3d33.88749800000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda70d59cab0847f%3A0xc08df9e994c83c8b!2sMoto%20Paco!5e1!3m2!1sen!2sma!4v1780678711436!5m2!1sen!2sma" 
            className="absolute inset-0 w-full h-full" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>

      {/* ===== TRUST + NEWSLETTER FOOTER BAR ===== */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Truck className="w-8 h-8 text-[#E63012]" />
              <p className="font-bold text-xs uppercase tracking-wide text-gray-800">Livraison Offerte</p>
              <p className="text-xs text-gray-500">Dès 2000 DH d'achat</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CreditCard className="w-8 h-8 text-[#E63012]" />
              <p className="font-bold text-xs uppercase tracking-wide text-gray-800">Paiement à la Livraison</p>
              <p className="text-xs text-gray-500">Réglez en espèces à la réception</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <RotateCcw className="w-8 h-8 text-[#E63012]" />
              <p className="font-bold text-xs uppercase tracking-wide text-gray-800">Retours 30 jours</p>
              <p className="text-xs text-gray-500">Échange ou remboursement</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-[#E63012]" />
              <p className="font-bold text-xs uppercase tracking-wide text-gray-800">Produits 100% Officiels</p>
              <p className="text-xs text-gray-500">Garantie constructeur</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== AVIS CLIENTS ===== */}
      <section className="bg-[#f8f9fa] py-10 sm:py-14 border-b border-gray-200">
        <div className="max-w-[1650px] mx-auto px-3 sm:px-4 lg:px-8">

          {/* Section Header — same style as other sections */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex-1 h-px bg-gray-300 hidden sm:block"></div>
            <div className="w-1 h-[22px] bg-[#E63012] ml-4 mr-3 hidden sm:block"></div>
            <h2 className="section-title text-center">
              CE QU'ILS DISENT DE NOUS
            </h2>
            <div className="w-1 h-[22px] bg-[#E63012] ml-3 mr-4 hidden sm:block"></div>
            <div className="flex-1 h-px bg-gray-300 hidden sm:block"></div>
          </div>

          {/* Rating summary */}
          <div className="flex items-center justify-center gap-3 mb-8 sm:mb-10">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
            </div>
            <span className="font-black text-[#111] text-lg">4,8</span>
            <span className="text-gray-400 text-sm font-medium">/ 5</span>
            <span className="text-gray-300">·</span>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">+1 200 Avis Vérifiés</span>
          </div>

          {/* Grid of Reviews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {moroccanReviews.slice(0, showAllReviews ? moroccanReviews.length : 6).map((review, idx) => (
              <div
                key={idx}
                className="flex flex-col bg-white border border-gray-200 hover:border-[#E63012]/40 hover:shadow-md rounded-xl p-5 transition-all duration-300 relative group"
              >
                {/* Red left accent bar on hover */}
                <div className="absolute top-0 left-0 w-[3px] h-full bg-[#E63012] rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Stars & verified badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="bg-green-50 text-green-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                    ✓ Achat vérifié
                  </span>
                </div>

                {/* Review text */}
                <p className="text-gray-600 text-xs sm:text-[13px] italic leading-relaxed flex-1 mb-4">
                  &ldquo;{review.text}&rdquo;
                </p>

                {/* Reviewer info */}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-xs shrink-0"
                    style={{ background: 'linear-gradient(135deg, #E63012, #b02200)' }}
                  >
                    {review.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-black text-[#111] text-xs">{review.name}</p>
                    <p className="text-gray-400 text-[10px] mt-0.5 flex items-center gap-1">
                      <span>📍</span> {review.city}, Maroc
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Toggle button */}
          <div className="flex justify-center mt-8 sm:mt-10">
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="bg-white border-2 border-gray-200 hover:border-[#E63012] text-gray-600 hover:text-[#E63012] px-8 py-3 rounded-lg text-xs font-black uppercase tracking-[2px] transition-all duration-300 shadow-sm hover:shadow-md"
            >
              {showAllReviews ? "VOIR MOINS D'AVIS" : "VOIR PLUS D'AVIS"}
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;