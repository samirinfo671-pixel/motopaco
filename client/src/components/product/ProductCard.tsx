import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types/product.ts';
import { formatPrice } from '../../lib/formatters.ts';
import { ProductImg } from './ProductImg.tsx';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Link 
      to={`/produit/${product.slug}`} 
      className={`group bg-white border border-gray-100 p-3 flex flex-col h-full hover:border-gray-300 hover:shadow-lg transition-all rounded ${product.total_stock === 0 ? 'opacity-70' : ''}`}
    >
      {/* Product Image Area */}
      <div className="relative w-full pb-[100%] h-0 bg-white mb-2 overflow-hidden">
        {product.sale_price !== null && (
          <span 
            className="absolute top-0 left-0 text-white text-[9px] font-black uppercase px-2 py-0.5 z-10"
            style={{ backgroundColor: '#ff1a00' }}
          >
            SOLDES !
          </span>
        )}
        {product.total_stock === 0 && (
          <span 
            className="absolute top-0 right-0 bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 z-10"
          >
            ÉPUISÉ
          </span>
        )}
        <ProductImg
          src={product.primary_image}
          alt={product.name}
          fallbackText={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain p-2 mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Card Details */}
      <div className="flex flex-col flex-1 items-center justify-between text-center px-1 pb-1">
        
        <div className="w-full flex flex-col items-center">
          {/* Brand Name */}
          <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: '#ff1a00' }}>
            {product.brand_name || 'MOTO PACO'}
          </span>

          {/* Product Name */}
          <h3
            className="text-[11px] font-extrabold uppercase leading-snug line-clamp-2 mb-2 min-h-[32px] flex items-center justify-center text-center"
            style={{ fontFamily: "'Montserrat', sans-serif", color: '#111' }}
          >
            {product.name}
          </h3>

          {/* Star Rating Indicator */}
          <div className="flex items-center justify-center gap-0.5 mb-3">
            {Array.from({ length: 5 }).map((_, i) => {
              const starValue = i + 1;
              const isFilled = (product.rating || 5) >= starValue;
              return (
                <svg 
                  key={i} 
                  viewBox="0 0 24 24" 
                  className="w-3.5 h-3.5" 
                  fill={isFilled ? "#ffbf00" : "#e5e7eb"} 
                  stroke={isFilled ? "#ffbf00" : "#d1d5db"}
                  strokeWidth="1"
                >
                  <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                </svg>
              );
            })}
            {(product.review_count ?? 0) > 0 && (
              <span className="text-[9px] text-gray-400 font-bold ml-1">({product.review_count})</span>
            )}
          </div>
        </div>

        <div className="mt-auto w-full">
          {product.base_price <= 0 ? (
            <div className="flex items-center justify-center mb-3">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                Prix sur demande
              </span>
            </div>
          ) : product.sale_price !== null ? (
            <div className="flex items-center justify-center space-x-1.5 font-bold mb-3">
              <span className="text-[15px]" style={{ color: '#ff1a00' }}>
                {formatPrice(product.sale_price)}
              </span>
              <span className="text-[11px] text-gray-400 line-through">
                {formatPrice(product.base_price)}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center mb-3">
              <span className="text-[15px] font-bold" style={{ color: '#ff1a00' }}>
                {formatPrice(product.base_price)}
              </span>
            </div>
          )}


          {/* Bottom Trust Badge */}
          <div className="w-full pt-2 border-t border-gray-100 flex items-center justify-center">
            {product.sale_price !== null || product.base_price >= 2000 ? (
              <span className="text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                🚚 LIVRAISON OFFERTE
              </span>
            ) : (
              <span className="text-[8px] font-black text-gray-600 bg-gray-50 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                💳 PAYER À LA LIVRAISON
              </span>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
};

export default ProductCard;
