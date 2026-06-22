import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, ShoppingBag, Truck, ShieldCheck, RefreshCw, Plus, Minus, ArrowRight, Loader2, ChevronLeft, Zap, Award, Edit } from 'lucide-react';
import api from '../lib/api.ts';
import { Product, ProductVariant, Bundle } from '../types/product.ts';
import { formatPrice } from '../lib/formatters.ts';
import { useCartStore } from '../store/cart.ts';
import { useUIStore } from '../store/ui.ts';
import { useAuthStore } from '../store/auth.ts';
import ImageGallery from '../components/product/ImageGallery.tsx';
import SEOHead from '../components/seo/SEOHead.tsx';
import { trackViewContent } from '../lib/pixels.ts';

export const Produit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { setCartOpen } = useUIStore();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('212667389916');

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeSizeTab, setActiveSizeTab] = useState<'casques' | 'vestes' | 'gants' | 'bottes'>('casques');

  const getInitialSizeGuideTab = (categorySlug?: string): 'casques' | 'vestes' | 'gants' | 'bottes' => {
    if (!categorySlug) return 'casques';
    const slug = categorySlug.toLowerCase();
    if (slug.includes('casque')) return 'casques';
    if (slug.includes('veste') || slug.includes('blouson') || slug.includes('pantalon') || slug.includes('combinaison')) return 'vestes';
    if (slug.includes('gant')) return 'gants';
    if (slug.includes('botte') || slug.includes('chaussure') || slug.includes('basket')) return 'bottes';
    return 'casques';
  };

  const getEstimatedDelivery = () => {
    const now = new Date();
    const start = new Date(); start.setDate(now.getDate() + 3);
    const end = new Date(); end.setDate(now.getDate() + 4);
    const months = ['JANVIER','FÉVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOÛT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DÉCEMBRE'];
    const startDay = start.getDate(), endDay = end.getDate();
    if (start.getMonth() === end.getMonth()) return `DU ${startDay} AU ${endDay} ${months[start.getMonth()]}`;
    return `DU ${startDay} ${months[start.getMonth()]} AU ${endDay} ${months[end.getMonth()]}`;
  };

  useEffect(() => {
    const loadProductData = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/products/${slug}`);
        const prodData = response.data;
        setProduct(prodData);
        trackViewContent({ id: prodData.id, name: prodData.name, price: prodData.sale_price ?? prodData.base_price, category: prodData.category_slug });
        if (prodData.variants?.length > 0) {
          const inStock = prodData.variants.find((v: any) => v.stock > 0);
          setSelectedVariant(inStock || prodData.variants[0]);
        }
        const bundlesRes = await api.get(`/bundles/for-product/${prodData.id}`);
        setBundles(bundlesRes.data || []);
        const reviewsRes = await api.get(`/products/${prodData.id}/reviews`);
        setReviews(reviewsRes.data || []);
        try {
          const relatedRes = await api.get(`/products?category=${prodData.category_slug}&limit=5`);
          if (relatedRes.data?.products) {
            setRelatedProducts(relatedRes.data.products.filter((p: any) => p.id !== prodData.id).slice(0, 4));
          }
        } catch {}
        try {
          const settingsRes = await api.get('/settings');
          setWhatsappNumber(settingsRes.data?.whatsapp_number || '212667389916');
        } catch {}
        const stored = localStorage.getItem('packmoto-recent-viewed');
        let recent: Product[] = stored ? JSON.parse(stored) : [];
        recent = recent.filter(p => p.id !== prodData.id);
        recent.unshift(prodData);
        recent = recent.slice(0, 4);
        localStorage.setItem('packmoto-recent-viewed', JSON.stringify(recent));
        setRecentlyViewed(recent.filter(p => p.id !== prodData.id));
      } catch (err) {
        console.error('Error fetching product details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProductData();
  }, [slug]);

  const handleQtyChange = (val: number) => {
    if (val < 1) return;
    if (selectedVariant && val > selectedVariant.stock) return;
    setQuantity(val);
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    setIsAdding(true);
    setTimeout(() => {
      addItem(product, selectedVariant, quantity);
      setIsAdding(false);
      setCartOpen(true);
    }, 600);
  };

  const handleBuyNow = () => {
    if (!product || !selectedVariant) return;
    addItem(product, selectedVariant, quantity);
    navigate('/commande');
  };

  const handleAddBundle = async (bundle: Bundle) => {
    try {
      for (const prod of bundle.products) {
        const res = await api.get(`/products/${prod.slug}`);
        const fullProd = res.data;
        const defaultVar = fullProd.variants?.length > 0
          ? fullProd.variants[0]
          : { id: 0, product_id: fullProd.id, size: 'Taille Unique', color: 'Standard', sku: 'DEF-SKU', stock: 10 };
        addItem(fullProd, defaultVar, 1);
      }
      setCartOpen(true);
    } catch (err) {
      console.error('Error adding bundle:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] pt-32 pb-16 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#E63012]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] pt-32 pb-16 text-center">
        <h2 className="text-[#111827] text-2xl font-bold">Produit introuvable</h2>
        <Link to="/boutique" className="text-[#E63012] mt-4 inline-block hover:underline">Retour à la boutique</Link>
      </div>
    );
  }

  const basePrice = product.base_price;
  let salePrice = product.sale_price;
  let currentPrice = salePrice !== null ? salePrice : basePrice;

  if (selectedVariant && selectedVariant.price_override !== null && selectedVariant.price_override !== undefined) {
    currentPrice = selectedVariant.price_override;
    salePrice = null; // Override removes default sale logic
  }

  const discountPercent = salePrice !== null ? Math.round((1 - salePrice / basePrice) * 100) : 0;
  const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : false;
  const isLowStock = selectedVariant ? selectedVariant.stock > 0 && selectedVariant.stock <= 5 : false;

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [product.primary_image || 'https://picsum.photos/seed/default/600/600'],
    "description": product.short_description || product.description,
    "sku": selectedVariant?.sku || 'MP-SKU-DEFAULT',
    "brand": { "@type": "Brand", "name": product.brand_name || 'MOTO PACO' },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "MAD",
      "price": currentPrice.toString(),
      "availability": selectedVariant && selectedVariant.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": { "@type": "Organization", "name": "MOTO PACO" }
    },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": reviews.length > 0 ? reviews.length.toString() : "3" }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-0 lg:pt-6 pb-32 lg:pb-16">
      <SEOHead
        title={`${product.name} Maroc | Prix et Caractéristiques - MOTO PACO`}
        description={product.short_description || product.description}
        schema={productSchema}
      />

      {/* ─── Mobile top back nav ─────────────────────────────── */}
      <div className="lg:hidden sticky top-[80px] z-30 bg-white border-b border-gray-100 px-3 py-2.5 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-600 hover:text-[#E63012] transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-xs font-bold truncate max-w-[200px] text-gray-700">{product.name}</span>
        </button>
      </div>

      <div className="max-w-[1650px] mx-auto px-3 sm:px-6 lg:px-8">

        {/* Breadcrumbs — desktop only */}
        <div className="hidden lg:flex items-center justify-between text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-8">
          <div className="flex items-center space-x-1.5">
            <Link to="/" className="hover:text-black transition-colors">Accueil</Link>
            <span className="text-gray-300">/</span>
            <Link to="/boutique" className="hover:text-black transition-colors">Boutique</Link>
            <span className="text-gray-300">/</span>
            <Link to={`/categorie/${product.category_slug}`} className="hover:text-black transition-colors">{product.category_name}</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <button onClick={() => navigate(-1)} className="hover:text-black transition-colors" aria-label="Précédent">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-300">|</span>
            <Link to="/boutique" className="hover:text-black transition-colors" aria-label="Suivant">
              <span className="text-[10px] tracking-widest font-black">&gt;</span>
            </Link>
          </div>
        </div>

        {/* ─── Main 2-col grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 mb-10 lg:mb-16">

          {/* ── Left: Images ── */}
          <div className="lg:col-span-6 relative">
            {/* Promo Badges Desktop Overlay */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
              {salePrice !== null && (
                <span className="bg-[#E63012] text-white text-[9px] font-black px-2.5 py-1 uppercase tracking-wider shadow-sm">
                  PROMO -{((1 - salePrice / basePrice) * 100).toFixed(2).replace('.', ',')}%
                </span>
              )}
              <span className="bg-black text-white text-[9px] font-black px-2.5 py-1 uppercase tracking-wider shadow-sm">
                Retour GRATUIT
              </span>
              {salePrice !== null && (
                <span className="bg-[#F5A623] text-white text-[9px] font-black px-2.5 py-1 uppercase tracking-wider shadow-sm">
                  Promo !
                </span>
              )}
            </div>

            <ImageGallery
              images={product.images || [{ url: product.primary_image || '', is_primary: 1 }]}
              activeImageOverride={selectedVariant?.image_url}
            />
          </div>

          {/* ── Right: Info panel ── */}
          <div className="lg:col-span-6 space-y-4 lg:space-y-6">

            {/* Brand badge + name */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-black text-white text-[9px] font-mono tracking-widest font-black uppercase px-2.5 py-1 rounded-sm">
                  Officiel {product.brand_name}
                </span>
                {selectedVariant && (
                  <span className="bg-gray-100 text-gray-500 text-[9px] font-mono px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wider">
                    SKU: {selectedVariant.sku}
                  </span>
                )}
              </div>
              <h1 className="font-bold text-2xl sm:text-3xl text-black tracking-normal uppercase leading-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {product.name}
              </h1>

              {/* Stars + reviews count */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 fill-current ${i < Math.floor(product.rating || 4.8) ? '' : 'text-[#E5E7EB]'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-black text-black">{reviews.length || 62} avis</span>
                </div>
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-[#E63012] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <span className="animate-pulse">🔥</span>
                  <span>+<strong>{product.sold_count || 120}</strong> vendus</span>
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* ─── Price box ─────────────────────────────────── */}
            <div className="bg-white border border-gray-200/80 p-5 rounded-none shadow-sm space-y-4">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                {/* Public vs Sale Price Details */}
                <div className="space-y-1">
                  {basePrice > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase">
                      <span>Prix public conseillé</span>
                      <span className="font-mono text-gray-400 line-through text-sm">
                        {formatPrice(basePrice)}
                      </span>
                    </div>
                  )}
                  {salePrice !== null && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#E63012] px-2.5 py-1 rounded text-[11px] font-bold w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E63012] animate-pulse"></span>
                      <span>Meilleur prix garanti · Économisez {formatPrice(basePrice - salePrice)}</span>
                    </div>
                  )}
                </div>

                {/* Savings Percent Badge */}
                {salePrice !== null && (
                  <div className="bg-[#E63012] text-white font-extrabold text-xs px-3 py-1.5 rounded-none uppercase tracking-wider text-center flex flex-col justify-center min-w-[120px] shadow-sm">
                    <span className="text-[9px] font-bold text-white/70 uppercase block leading-none">Économie réalisée</span>
                    <span className="text-sm font-black mt-1 leading-none">-{((1 - salePrice / basePrice) * 100).toFixed(2).replace('.', ',')}%</span>
                  </div>
                )}
              </div>

              {/* Main Price */}
              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase text-[#E63012] tracking-wider leading-none">Votre prix Moto Paco</p>
                <div className="flex items-baseline gap-2 mt-1">
                  {currentPrice <= 0 ? (
                    <span className="text-3xl font-black text-[#E63012] tracking-tight leading-none uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      Sur demande
                    </span>
                  ) : (
                    <>
                      <span className="text-4xl font-black text-[#E63012] tracking-tight leading-none" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        {formatPrice(currentPrice)}
                      </span>
                      <span className="text-xs text-gray-400 font-bold uppercase">TTC</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stock indicator */}
            {selectedVariant && selectedVariant.stock > 0 ? (
              <div className="border border-green-500/20 bg-green-50/30 p-4 rounded-xl flex items-center gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                <div className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
                <div className="text-xs">
                  <p className="font-black text-green-800 uppercase tracking-wider text-[12px] leading-tight">En stock - Prêt à être expédié</p>
                  <p className="text-gray-500 font-medium mt-1 leading-normal">Commande passée avant 14h expédiée le jour même (Livraison 24/48h)</p>
                </div>
              </div>
            ) : (
              <div className="border border-red-500/20 bg-red-50/30 p-4 rounded-xl flex items-center gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                <div className="h-3 w-3 rounded-full bg-red-500 shrink-0"></div>
                <div className="text-xs">
                  <p className="font-black text-red-800 uppercase tracking-wider text-[12px] leading-tight">Rupture de Stock</p>
                  <p className="text-gray-500 font-medium mt-1 leading-normal">Ce produit est victime de son succès. Réapprovisionnement en cours.</p>
                </div>
              </div>
            )}

            {/* ─── Variants / Sizes ─────────────────────────── */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-display font-black text-black uppercase tracking-widest">Options / Tailles</h3>
                  <button 
                    onClick={() => {
                      if (product) {
                        setActiveSizeTab(getInitialSizeGuideTab(product.category_slug));
                      }
                      setIsSizeGuideOpen(true);
                    }}
                    className="text-[#E63012] font-black text-[10px] tracking-wider uppercase border-b border-[#E63012] pb-0.5 hover:text-black transition-colors"
                  >
                    Guide des tailles
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                        disabled={v.stock === 0}
                        className={`py-3 px-2 text-xs font-display font-bold border transition-all text-center rounded-none relative flex flex-col items-center justify-center min-h-[52px] ${
                          isSelected
                            ? 'border-black bg-black text-white shadow-sm'
                            : v.stock === 0
                            ? 'border-gray-100 bg-gray-50/50 text-gray-300 cursor-not-allowed line-through opacity-40'
                            : 'border-gray-200 bg-white text-black hover:border-black hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-black uppercase text-[11px] tracking-wider">{v.size || 'Taille Unique'}</span>
                        {v.color && v.color !== 'Standard' && (
                          <span className={`text-[8px] tracking-wider mt-0.5 truncate max-w-full font-mono uppercase ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>{v.color}</span>
                        )}
                        {isSelected && <div className="absolute bottom-1 right-2 w-1.5 h-1.5 bg-[#E63012] rounded-full"></div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Variant description */}
            {selectedVariant?.description && (
              <div className="bg-[#F9FAFB] border-l-2 border-l-[#E63012] border border-gray-200 p-3.5 rounded-r text-xs text-[#4B5563] leading-relaxed">
                <span className="text-[9px] font-black text-[#E63012] uppercase tracking-widest block mb-1">Spécifications :</span>
                <p className="whitespace-pre-line font-medium">{selectedVariant.description}</p>
              </div>
            )}

            {/* ─── Delivery badges ─────────────────────────── */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <span className="text-xl">📅</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider leading-none">Livraison estimée</span>
                  <span className="text-[11px] sm:text-xs font-black text-gray-800 mt-1.5 leading-none">{getEstimatedDelivery()}</span>
                </div>
              </div>
              <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <Truck className="w-5 h-5 text-[#E63012] flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider leading-none">Frais de port</span>
                  <span className="text-[11px] sm:text-xs font-black text-green-600 mt-1.5 leading-none uppercase">LIVRAISON OFFERTE</span>
                </div>
              </div>
            </div>

            {/* ─── Qty + CTA — DESKTOP only (mobile uses sticky bar) ── */}
            <div className="hidden lg:block space-y-4">
              <div className="flex gap-3 items-stretch">
                {/* Stepper */}
                <div className="flex items-center gap-3 bg-white border border-gray-200 px-4 py-2 shrink-0 rounded-none shadow-sm">
                  <button onClick={() => handleQtyChange(quantity - 1)} disabled={quantity <= 1} className="text-gray-500 hover:text-[#E63012] disabled:text-gray-300 transition-colors" aria-label="Moins">
                    <Minus className="w-4 h-4 stroke-[3px]" />
                  </button>
                  <span className="text-sm font-mono font-black text-black w-5 text-center select-none">{quantity}</span>
                  <button onClick={() => handleQtyChange(quantity + 1)} disabled={selectedVariant ? quantity >= selectedVariant.stock : true} className="text-gray-500 hover:text-[#E63012] disabled:text-gray-300 transition-colors" aria-label="Plus">
                    <Plus className="w-4 h-4 stroke-[3px]" />
                  </button>
                </div>
                {/* Main CTA: Add to cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || isOutOfStock || isAdding}
                  className="flex-1 bg-black hover:bg-gray-900 text-white py-4 px-4 rounded-none font-display font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-1.5 transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400 shadow-sm"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isOutOfStock ? (
                    <span>ÉPUISÉ</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 stroke-[2.5px]" />
                      <span>PANIER</span>
                    </>
                  )}
                </button>
                {/* Buy Now CTA */}
                <button
                  onClick={handleBuyNow}
                  disabled={!selectedVariant || isOutOfStock}
                  className="flex-1 bg-[#E63012] hover:bg-black text-white py-4 px-4 rounded-none font-display font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-1.5 transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400 shadow-sm"
                >
                  {isOutOfStock ? (
                    <span>RUPTURE DE STOCK</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>ACHETER DIRECT</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ─── Trust badges ─────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2 border-t border-gray-200 pt-6 text-center">
              <div className="flex flex-col items-center p-3 bg-white border border-gray-100 hover:border-gray-300 transition-all text-xs">
                <div className="relative w-8 h-8 flex items-center justify-center mb-1.5">
                  <Truck className="w-6 h-6 text-black" />
                  <span className="absolute -top-1 -right-1 bg-[#E63012] text-white text-[7px] px-1 py-0.5 rounded-full font-black leading-none">Gift</span>
                </div>
                <span className="font-extrabold text-black uppercase tracking-wider text-[11px]">LIVRAISON OFFERTE</span>
                <span className="text-gray-400 mt-1 text-[10px] leading-tight font-medium">Livraison gratuite dès 2000 DH d'achat</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-white border border-gray-100 hover:border-gray-300 transition-all text-xs">
                <div className="relative w-8 h-8 flex items-center justify-center mb-1.5">
                  <RefreshCw className="w-6 h-6 text-[#E63012]" />
                </div>
                <span className="font-extrabold text-black uppercase tracking-wider text-[11px]">RETOURS GRATUITS</span>
                <span className="text-gray-400 mt-1 text-[10px] leading-tight font-medium">Échangez gratuitement pendant 30 jours</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-white border border-gray-100 hover:border-gray-300 transition-all text-xs">
                <div className="relative w-8 h-8 flex items-center justify-center mb-1.5">
                  <Award className="w-6 h-6 text-black" />
                </div>
                <span className="font-extrabold text-black uppercase tracking-wider text-[11px]">PROGRAMME FIDÉLITÉ</span>
                <span className="text-gray-400 mt-1 text-[10px] leading-tight font-medium">Cumulez des réductions après chaque achat</span>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Bundles ─────────────────────────────────────────── */}
        {bundles.length > 0 && (
          <div className="bg-white border border-gray-200 p-5 sm:p-8 mb-10 lg:mb-16 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
              <h3 className="section-title flex items-center gap-2 pr-6">
                <span>⚡ Offre Spéciale : Fréquemment achetés ensemble</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="bg-[#E63012]/10 text-[#E63012] border border-[#E63012]/20 text-[9px] font-mono font-black uppercase px-2.5 py-1 tracking-widest rounded-sm">
                  Offre Limitée
                </span>
                <span className="bg-[#F5A623]/10 text-[#D08600] border border-[#F5A623]/20 text-[9px] font-mono font-black uppercase px-2.5 py-1 tracking-widest rounded-sm">
                  Économie Immédiate
                </span>
              </div>
            </div>

            {bundles.map((bundle) => {
              const bundleSubtotal = bundle.products.reduce((sum, p) => sum + (p.sale_price ?? p.base_price), 0);
              const discountPercent2 = bundle.discount_percent || 10;
              const bundleSavings = Math.round(bundleSubtotal * (discountPercent2 / 100));
              const bundleTotal = bundleSubtotal - bundleSavings;
              return (
                <div key={bundle.id} className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
                  {/* Products list scrollable */}
                  <div className="flex items-center gap-4 overflow-x-auto w-full lg:flex-1 pb-3 lg:pb-0 scrollbar-none">
                    {bundle.products.map((bp, i) => (
                      <React.Fragment key={bp.id}>
                        {i > 0 && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 font-extrabold text-lg select-none">
                            +
                          </div>
                        )}
                        <Link to={`/produit/${bp.slug}`} className="shrink-0 flex items-center gap-4 bg-white border border-gray-200 hover:border-black p-4 rounded-none transition-all group max-w-[280px] shadow-sm hover:shadow-md">
                          <img src={bp.primary_image || `https://picsum.photos/seed/${bp.slug}/100/100`} alt={bp.name} referrerPolicy="no-referrer" className="w-16 h-16 object-contain bg-[#F9FAFB] border border-gray-100 p-1 group-hover:scale-105 transition-transform shrink-0" />
                          <div className="text-left min-w-0">
                            <p className="text-[9px] font-mono text-[#E63012] font-black uppercase tracking-wider">{bp.brand_name}</p>
                            <p className="text-xs text-[#111827] font-black truncate w-36 uppercase tracking-wide">{bp.name}</p>
                            <p className="text-sm text-black font-black font-mono mt-1">{formatPrice(bp.sale_price ?? bp.base_price)}</p>
                          </div>
                        </Link>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Red/Black Price details & CTA */}
                  <div className="w-full lg:w-80 shrink-0 bg-[#F9FAFB] border border-gray-200 p-6 flex flex-col justify-between gap-5">
                    <div className="space-y-3">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">PRIX DU PACK SPECIAL</p>
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-3xl font-mono font-black text-[#E63012]" style={{ fontFamily: "'Montserrat', sans-serif" }}>{formatPrice(bundleTotal)}</span>
                        <span className="text-xs font-mono text-gray-400 line-through font-bold">{formatPrice(bundleSubtotal)}</span>
                      </div>
                      <div className="bg-[#E63012]/10 border border-[#E63012]/20 text-[#E63012] text-[10px] font-black px-2.5 py-1 inline-block uppercase tracking-wider font-mono rounded-sm">
                        ÉCONOMISEZ {formatPrice(bundleSavings)} (-{discountPercent2}%)
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAddBundle(bundle)} 
                      className="bg-black hover:bg-[#E63012] text-white py-4 px-6 rounded-none font-display font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg w-full duration-300"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>AJOUTER LE PACK</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Tab section ─────────────────────────────────────── */}
        <div className="border border-gray-200 bg-white rounded-lg overflow-hidden mb-10 lg:mb-16 shadow-sm">
          <div className="flex border-b border-gray-200 bg-[#F9FAFB] overflow-x-auto scrollbar-none">
            {(['desc', 'specs', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 sm:px-8 py-4 font-display font-black uppercase tracking-widest text-[10px] sm:text-[11px] border-b-2 transition-all shrink-0 ${
                  activeTab === tab ? 'border-[#E63012] text-[#E63012] bg-white' : 'border-transparent text-gray-500 hover:text-black'
                }`}
              >
                {tab === 'desc' && 'Description'}
                {tab === 'specs' && 'Fiche Technique'}
                {tab === 'reviews' && `Avis (${reviews.length})`}
              </button>
            ))}
          </div>
          <div className="p-4 sm:p-6 lg:p-8 text-sm text-[#4B5563] leading-relaxed space-y-4">
            {activeTab === 'desc' && (
              <div 
                className="text-[#111827]/90 text-[13px] leading-relaxed html-description"
                dangerouslySetInnerHTML={{ __html: product.description || '' }}
              />
            )}
            {activeTab === 'specs' && (
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
                  <tbody>
                    <tr className="border-b border-gray-100 bg-[#F9FAFB]">
                      <td className="font-extrabold text-[#111827] py-3.5 px-4 uppercase w-1/3 tracking-wider">Fabricant</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-700">{product.brand_name}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="font-extrabold text-[#111827] py-3.5 px-4 uppercase w-1/3 tracking-wider">Catégorie</td>
                      <td className="py-3.5 px-4 uppercase font-bold text-gray-700">{product.category_name}</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-[#F9FAFB]">
                      <td className="font-extrabold text-[#111827] py-3.5 px-4 uppercase w-1/3 tracking-wider">Condition</td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium">Neuf (Emballage scellé d'origine)</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="font-extrabold text-[#111827] py-3.5 px-4 uppercase w-1/3 tracking-wider">Homologation</td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium font-mono">Certifié conforme CE / ECE 22.06</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-center text-xs py-8 text-gray-400 font-medium uppercase tracking-wider">Aucun avis pour le moment.</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="border border-gray-100 bg-[#F9FAFB] p-4 sm:p-5 rounded-lg space-y-3 shadow-sm hover:border-[#E63012]/30 transition-colors">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-[#111827] uppercase tracking-wide">{rev.first_name} {rev.last_name || 'Alami'}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{new Date(rev.created_at).toLocaleDateString('fr-MA')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} className={`w-3.5 h-3.5 fill-current ${idx < rev.rating ? '' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        {rev.is_verified === 1 && (
                          <span className="bg-green-50 border border-green-200 text-green-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">Achat vérifié</span>
                        )}
                      </div>
                      <h4 className="text-[13px] font-black text-[#111827] uppercase tracking-wide">{rev.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{rev.body}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Related products ─────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <div className="space-y-5 mb-10 lg:mb-16">
            <h3 className="section-title border-b-2 border-black pb-4 flex items-center justify-between">
              <span>Produits Similaires</span>
              <span className="text-[10px] font-mono text-[#E63012] font-black tracking-widest uppercase font-bold not-italic">MÊME CATÉGORIE</span>
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((item) => {
                const imgUrl = item.primary_image || item.images?.find((img: any) => img.is_primary)?.url || 'https://picsum.photos/seed/default/600/600';
                return (
                  <div key={item.id} className="bg-white border border-gray-200 rounded p-3 sm:p-4 flex flex-col justify-between hover:border-[#E63012] hover:shadow-lg transition-all duration-300 group">
                    <Link to={`/produit/${item.slug}`} className="block overflow-hidden aspect-square bg-[#F9FAFB] rounded relative p-2 mb-3">
                      {item.sale_price !== null && (
                        <span className="absolute top-2 left-2 bg-[#E63012] text-white text-[8px] font-black uppercase px-1.5 py-0.5 z-10 rounded-sm">SOLDE</span>
                      )}
                      <img src={imgUrl} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { const t = e.currentTarget; if (!t.src.includes('default')) t.src = 'https://picsum.photos/seed/default/600/600'; }}
                      />
                    </Link>
                    <div className="flex flex-col flex-grow justify-between">
                      <div>
                        <p className="text-[9px] font-mono text-[#E63012] font-black uppercase tracking-widest">{item.brand_name}</p>
                        <Link to={`/produit/${item.slug}`} className="text-xs font-black text-[#111827] hover:text-[#E63012] transition-colors line-clamp-2 leading-snug mt-0.5 block uppercase">{item.name}</Link>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-mono font-black text-[#E63012]">{formatPrice(item.sale_price ?? item.base_price)}</span>
                        {item.sale_price !== null && (
                          <span className="text-[10px] font-mono text-gray-400 line-through">{formatPrice(item.base_price)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Recently viewed ─────────────────────────────────── */}
        {recentlyViewed.length > 0 && (
          <div className="space-y-5">
            <h3 className="section-title border-b-2 border-black pb-4 flex items-center justify-between">
              <span>Consultés Récemment</span>
              <span className="text-[10px] font-mono text-gray-400 tracking-widest uppercase font-bold not-italic">HISTORIQUE</span>
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {recentlyViewed.map((item) => {
                const imgUrl = item.primary_image || item.images?.find((img: any) => img.is_primary)?.url || 'https://picsum.photos/seed/default/600/600';
                return (
                  <div key={item.id} className="bg-white border border-gray-200 rounded p-3 sm:p-4 flex flex-col justify-between hover:border-[#E63012] hover:shadow-lg transition-all duration-300 group">
                    <Link to={`/produit/${item.slug}`} className="block overflow-hidden aspect-square bg-[#F9FAFB] rounded relative p-2 mb-3">
                      <img src={imgUrl} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { const t = e.currentTarget; if (!t.src.includes('default')) t.src = 'https://picsum.photos/seed/default/600/600'; }}
                      />
                    </Link>
                    <div className="flex flex-col flex-grow justify-between">
                      <div>
                        <p className="text-[9px] font-mono text-[#E63012] font-black uppercase tracking-widest">{item.brand_name}</p>
                        <Link to={`/produit/${item.slug}`} className="text-xs font-black text-[#111827] hover:text-[#E63012] transition-colors line-clamp-2 leading-snug mt-0.5 block uppercase">{item.name}</Link>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-gray-100">
                        <p className="text-xs font-mono font-black text-[#111827]">{formatPrice(item.sale_price ?? item.base_price)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── MOBILE STICKY BOTTOM CTA BAR ─────────────────────── */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-[56px] left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
        {/* Urgency ticker */}
        {isLowStock && (
          <div className="bg-amber-500 text-white text-center text-[10px] font-black uppercase tracking-widest py-1 px-4 flex items-center justify-center gap-2">
            <span className="animate-pulse">⚡</span>
            <span>STOCK LIMITÉ — COMMANDEZ MAINTENANT</span>
            <span className="animate-pulse">⚡</span>
          </div>
        )}

        {/* Price + buttons row */}
        {currentPrice <= 0 ? (
          <div className="px-3 py-3">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                `Bonjour MOTO PACO, je souhaiterais obtenir le prix et commander le produit suivant :\n\nProduit : ${product.name}\nSKU : ${selectedVariant?.sku || 'N/A'}\nLien : ${window.location.href}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 px-4 font-display font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 2.019 14.113.992 11.488.992c-5.441 0-9.87 4.374-9.874 9.8.001 1.768.479 3.493 1.391 5.025l-1.007 3.684 3.793-.984c1.536.873 3.096 1.337 4.856 1.337z" />
              </svg>
              <span>DEMANDER LE PRIX SUR WHATSAPP</span>
            </a>
          </div>
        ) : (
          <div className="px-3 py-3 flex items-center gap-2.5">
            {/* Price display */}
            <div className="flex flex-col shrink-0">
              {salePrice !== null ? (
                <>
                  <span className="text-[10px] text-gray-400 line-through leading-none">{formatPrice(basePrice)}</span>
                  <span className="text-lg font-black text-[#E63012] leading-none">{formatPrice(currentPrice)}</span>
                </>
              ) : (
                <span className="text-lg font-black text-[#111827] leading-none">{formatPrice(currentPrice)}</span>
              )}
            </div>

            {/* Qty stepper (compact) */}
            <div className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-2 shrink-0 rounded-none">
              <button onClick={() => handleQtyChange(quantity - 1)} disabled={quantity <= 1} className="text-gray-500 disabled:text-gray-300 transition-colors" aria-label="Moins">
                <Minus className="w-3.5 h-3.5 stroke-[3px]" />
              </button>
              <span className="text-sm font-black text-black w-4 text-center select-none">{quantity}</span>
              <button onClick={() => handleQtyChange(quantity + 1)} disabled={selectedVariant ? quantity >= selectedVariant.stock : true} className="text-gray-500 disabled:text-gray-300 transition-colors" aria-label="Plus">
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
              </button>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || isOutOfStock || isAdding}
              className="flex-1 bg-[#E63012] text-white py-3.5 px-2 rounded-none font-display font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-1.5 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-md active:scale-95"
              id="mobile-add-to-cart"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isOutOfStock ? (
                <span>ÉPUISÉ</span>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>PANIER</span>
                </>
              )}
            </button>

            {/* Buy Now */}
            <button
              onClick={handleBuyNow}
              disabled={!selectedVariant || isOutOfStock}
              className="flex-1 bg-black text-white py-3.5 px-2 rounded-none font-display font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-1.5 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-md active:scale-95"
              id="mobile-buy-now"
            >
              {isOutOfStock ? (
                <span>RUPTURE</span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>ACHETER</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Trust micro-line */}
        <div className="flex items-center justify-center gap-4 pb-2 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Livraison offerte</span>
          <span className="text-gray-200">·</span>
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> 100% Authentique</span>
          <span className="text-gray-200">·</span>
          <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Échange sous 7j</span>
        </div>
      </div>

      {/* Size Guide Modal Overlay */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 max-w-2xl w-full rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-black text-white p-4 flex justify-between items-center border-b border-gray-800">
              <h3 className="font-display font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <span>📏 Guide des tailles</span>
              </h3>
              <button 
                onClick={() => setIsSizeGuideOpen(false)}
                className="text-gray-400 hover:text-white transition-colors font-black text-lg p-1"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
              {(['casques', 'vestes', 'gants', 'bottes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSizeTab(tab)}
                  className={`flex-1 min-w-[100px] py-3.5 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                    activeSizeTab === tab 
                      ? 'border-[#E63012] text-[#E63012] bg-white' 
                      : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-100/50'
                  }`}
                >
                  {tab === 'casques' && 'Casques'}
                  {tab === 'vestes' && 'Vestes'}
                  {tab === 'gants' && 'Gants'}
                  {tab === 'bottes' && 'Bottes / Chaussures'}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {activeSizeTab === 'casques' && (
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700">Comment mesurer votre taille de casque :</p>
                  <p className="text-gray-500 leading-relaxed font-medium">
                    Utilisez un mètre ruban et placez-le autour de votre tête, à environ 2,5 cm au-dessus de vos sourcils. Mesurez la partie la plus large de votre tête pour trouver la bonne taille.
                  </p>
                  <div className="border border-gray-200 rounded overflow-hidden mt-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black text-white uppercase text-[9px] tracking-wider border-b border-gray-800">
                          <th className="py-3 px-4">Taille</th>
                          <th className="py-3 px-4">Tour de tête (cm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">XS</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">53 - 54 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">S</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">55 - 56 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">M</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">57 - 58 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">L</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">59 - 60 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">XL</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">61 - 62 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">XXL</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">63 - 64 cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSizeTab === 'vestes' && (
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700">Comment mesurer votre taille de veste / blouson :</p>
                  <p className="text-gray-500 leading-relaxed font-medium">
                    Mesurez votre tour de poitrine à l'endroit le plus fort en gardant le ruban bien horizontal. Si vous êtes entre deux tailles, nous vous conseillons de choisir la taille supérieure.
                  </p>
                  <div className="border border-gray-200 rounded overflow-hidden mt-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black text-white uppercase text-[9px] tracking-wider border-b border-gray-800">
                          <th className="py-3 px-4">Taille</th>
                          <th className="py-3 px-4">Taille FR/IT</th>
                          <th className="py-3 px-4">Tour de poitrine (cm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">S</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">46</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">92 - 96 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">M</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">48</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">96 - 100 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">L</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">50</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">100 - 104 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">XL</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">52</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">104 - 108 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">XXL</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">54</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">108 - 112 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">3XL</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">56</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">112 - 116 cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSizeTab === 'gants' && (
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700">Comment mesurer votre taille de gants :</p>
                  <p className="text-gray-500 leading-relaxed font-medium">
                    Mesurez la largeur de votre main dominante au niveau des articulations des doigts (sans le pouce), main à plat et doigts serrés.
                  </p>
                  <div className="border border-gray-200 rounded overflow-hidden mt-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black text-white uppercase text-[9px] tracking-wider border-b border-gray-800">
                          <th className="py-3 px-4">Taille</th>
                          <th className="py-3 px-4">Mesure Universelle</th>
                          <th className="py-3 px-4">Tour de main (cm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">XS</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">6</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">15 - 17 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">S</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">7</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">17 - 19 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">M</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">8</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">19 - 21 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">L</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">9</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">21 - 23 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">XL</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">10</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">23 - 25 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">XXL</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">11</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">25 - 27 cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSizeTab === 'bottes' && (
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700">Correspondance des tailles de bottes / chaussures :</p>
                  <p className="text-gray-500 leading-relaxed font-medium">
                    Choisissez votre pointure européenne habituelle. Pour les bottes de moto sportives ou de route, si vous portez des chaussettes épaisses, n'hésitez pas à opter pour une demi-pointure au-dessus.
                  </p>
                  <div className="border border-gray-200 rounded overflow-hidden mt-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black text-white uppercase text-[9px] tracking-wider border-b border-gray-800">
                          <th className="py-3 px-4">EU</th>
                          <th className="py-3 px-4">US Homme</th>
                          <th className="py-3 px-4">UK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">39</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">6.5</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">5.5</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">40</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">7</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">6</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">41</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">8</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">7</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">42</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">8.5</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">7.5</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">43</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">9.5</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">8.5</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">44</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">10</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">9</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-black text-gray-900">45</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">11</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">10</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50/40">
                          <td className="py-2.5 px-4 font-black text-gray-900">46</td>
                          <td className="py-2.5 px-4 font-bold text-gray-600">12</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600">11</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setIsSizeGuideOpen(false)}
                className="bg-black hover:bg-[#E63012] text-white px-5 py-2 font-display font-black uppercase text-[10px] tracking-wider transition-colors duration-300"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating admin edit button */}
      {user?.role === 'admin' && product && (
        <Link
          to={`/admin/products?edit=${product.id}`}
          className="fixed bottom-28 right-6 z-[60] bg-black hover:bg-[#E63012] text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-110 active:scale-95 group border border-gray-800"
          title="Modifier ce produit (Admin)"
        >
          <Edit className="w-5 h-5 text-white" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out text-xs font-black uppercase tracking-widest whitespace-nowrap">
            Modifier le produit
          </span>
        </Link>
      )}
    </div>
  );
};

export default Produit;
