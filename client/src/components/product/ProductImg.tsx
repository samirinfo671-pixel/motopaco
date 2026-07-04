import React, { useState } from 'react';

interface ProductImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  fallbackText?: string;
}

/**
 * ProductImg — a drop-in <img> replacement with:
 *  - graceful onError fallback to a neutral SVG placeholder
 *  - no broken-image icon ever shown
 *  - supports all standard img attributes (className, loading, etc.)
 */
export const ProductImg: React.FC<ProductImgProps> = ({
  src,
  alt,
  fallbackText,
  className,
  ...rest
}) => {
  const [failed, setFailed] = useState(false);

  // Derive initials for the fallback label (e.g. "Casque AGV" → "CA")
  const label = fallbackText || alt || '';
  const initials = label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 select-none ${className || ''}`}
        aria-label={alt}
        role="img"
        {...(rest as any)}
      >
        <svg
          viewBox="0 0 80 80"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <rect width="80" height="80" fill="#f3f4f6" />
          {/* Subtle motorcycle helmet silhouette */}
          <path
            d="M40 18 C27 18 18 27 18 38 C18 48 24 56 34 58 L34 62 L46 62 L46 58 C56 56 62 48 62 38 C62 27 53 18 40 18 Z"
            fill="#e5e7eb"
          />
          <path
            d="M30 58 L50 58 L50 62 C50 63 49 64 48 64 L32 64 C31 64 30 63 30 62 Z"
            fill="#d1d5db"
          />
          {/* Visor line */}
          <path
            d="M24 37 C24 34 27 32 30 32 L50 32 C53 32 56 34 56 37"
            stroke="#d1d5db"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Initials text */}
          <text
            x="40"
            y="44"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
            fill="#9ca3af"
            letterSpacing="1"
          >
            {initials || '?'}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
};

export default ProductImg;
