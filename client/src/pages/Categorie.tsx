import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api.ts';
import { Product, Category } from '../types/product.ts';
import ProductGrid from '../components/product/ProductGrid.tsx';
import SEOHead from '../components/seo/SEOHead.tsx';

export const Categorie: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategoryData = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        // 1. Fetch Category metadata
        const catRes = await api.get(`/categories/${slug}`);
        setCategory(catRes.data);

        // 2. Fetch Products for this Category
        const prodRes = await api.get(`/products?category=${slug}&limit=20`);
        setProducts(prodRes.data.products || []);
      } catch (err) {
        console.error('Error loading category page:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategoryData();
  }, [slug]);

  const catName = category?.name || 'Catégorie';
  const metaTitle = category?.meta_title || `${catName} Moto Maroc | MOTO PACO`;
  const metaDesc = (category?.meta_description || `Achetez vos ${catName} moto au Maroc chez MOTO PACO. Meilleur prix, livraison 24-48h, paiement à la livraison.`).replace(/<[^>]*>/g, '').trim();

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-28 pb-16">
      <SEOHead
        title={metaTitle}
        description={metaDesc}
      />

      <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Category Header */}
        <div className="relative rounded overflow-hidden mb-10 border border-[#E5E7EB] aspect-[21/9] sm:aspect-[4/1] bg-[#FFFFFF]">
          {category?.image_url && (
            <img
              src={category.image_url}
              alt={catName}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
          
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 py-6">
            <Link to="/boutique" className="text-[#E63012] font-mono text-[10px] font-bold tracking-widest uppercase hover:underline mb-2">
              ← RETOUR À LA BOUTIQUE
            </Link>
            <h1 className="race-livery text-2xl sm:text-4xl md:text-5xl text-white">
              {catName}
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm max-w-lg mt-2 font-body leading-relaxed hidden sm:block">
              {metaDesc}
            </p>
          </div>
        </div>

        {/* Product listing grid */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-4">
            <h2 className="section-title">
              PRODUITS DISPONIBLES
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

export default Categorie;
