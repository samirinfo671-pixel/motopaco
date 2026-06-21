import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api.ts';
import { Product, Brand } from '../types/product.ts';
import ProductGrid from '../components/product/ProductGrid.tsx';
import SEOHead from '../components/seo/SEOHead.tsx';

export const Marque: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBrandData = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/brands/${slug}/products`);
        setBrand(response.data.brand);
        setProducts(response.data.products || []);
      } catch (err) {
        console.error('Error loading brand page:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadBrandData();
  }, [slug]);

  const brandName = brand?.name || 'Marque';
  const metaTitle = `Équipement ${brandName} Maroc | Prix et Choix - MOTO PACO`;
  const metaDesc = `Retrouvez tous les équipements officiels de la marque ${brandName} au Maroc chez MOTO PACO. Casques, gants et accessoires officiels. Livraison 24h.`;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-28 pb-16">
      <SEOHead
        title={metaTitle}
        description={metaDesc}
      />

      <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Brand Banner */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 sm:p-12 mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left space-y-2">
            <Link to="/boutique" className="text-[#E63012] font-mono text-[10px] font-bold tracking-widest uppercase hover:underline block mb-1">
              ← RETOUR À LA BOUTIQUE
            </Link>
            <h1 className="race-livery text-3xl sm:text-5xl text-[#111827]">
              {brandName}
            </h1>
            <p className="text-[#4B5563] text-xs sm:text-sm max-w-xl font-body leading-relaxed">
              Commandez vos équipements {brandName} 100% officiels en ligne. Garantie constructeur, livraison rapide dans tout le Maroc.
            </p>
          </div>
          
          {brand?.logo_url && (
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] px-8 py-6 rounded flex items-center justify-center h-28 w-48 shrink-0">
              <span className="font-display font-black text-3xl italic tracking-wider text-[#111827]">
                {brandName.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Product listing grid */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-4">
            <h2 className="section-title">
              GAMME {brandName.toUpperCase()} DISPONIBLE
            </h2>
            <span className="text-xs font-mono font-bold text-[#4B5563]">
              {products.length} produits trouvés
            </span>
          </div>

          <ProductGrid products={products} isLoading={isLoading} />
        </div>

      </div>
    </div>
  );
};

export default Marque;
