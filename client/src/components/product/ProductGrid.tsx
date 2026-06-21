import React from 'react';
import ProductCard from './ProductCard.tsx';
import Skeleton from '../ui/Skeleton.tsx';
import { Product } from '../../types/product.ts';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-4 space-y-4">
            <Skeleton variant="rect" className="w-full aspect-square" />
            <Skeleton variant="text" className="w-2/3 h-4" />
            <Skeleton variant="text" className="w-1/2 h-3" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton variant="text" className="w-1/3 h-4" />
              <Skeleton variant="circle" className="w-7 h-7" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 border border-[#E5E7EB] rounded bg-[#FFFFFF] p-8">
        <svg className="w-12 h-12 mx-auto text-[#4B5563] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-base text-[#111827] font-bold">Aucun produit trouvé</p>
        <p className="text-xs text-[#4B5563] mt-1">Essayez d'ajuster les filtres ou la recherche.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
