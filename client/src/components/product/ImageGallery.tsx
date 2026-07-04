import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { ProductImage } from '../../types/product.ts';
import { ProductImg } from './ProductImg.tsx';

interface ImageGalleryProps {
  images: ProductImage[];
  activeImageOverride?: string | null;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, activeImageOverride }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const galleryImages = React.useMemo(() => {
    let list = images && images.length > 0
      ? [...images]
      : [{ url: 'https://picsum.photos/seed/default/600/600', is_primary: 1 }];

    if (activeImageOverride && !list.some(img => img.url === activeImageOverride)) {
      list = [{ url: activeImageOverride, is_primary: 0 }, ...list];
    }
    return list;
  }, [images, activeImageOverride]);

  React.useEffect(() => {
    if (activeImageOverride) {
      const idx = galleryImages.findIndex(img => img.url === activeImageOverride);
      if (idx !== -1) setActiveIndex(idx);
    }
  }, [activeImageOverride, galleryImages]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const currentImage = galleryImages[activeIndex]?.url || 'https://picsum.photos/seed/default/600/600';

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4">
      {/* Thumbnails — bottom row on mobile, left column on desktop */}
      {galleryImages.length > 1 && (
        <div className="flex flex-row md:flex-col order-2 md:order-1 gap-2 md:gap-2.5 md:w-[72px] shrink-0 overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:max-h-[520px] scrollbar-none">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-14 h-14 md:w-[72px] md:h-[72px] shrink-0 rounded-lg overflow-hidden bg-white border-2 transition-all duration-200 ${
                activeIndex === idx
                  ? 'border-[#E63012] shadow-[0_0_0_1px_#E63012]'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <ProductImg
                src={img.url}
                alt={`Vue ${idx + 1}`}
                className="w-full h-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image Frame */}
      <div className="flex-1 order-1 md:order-2">
        <div className="relative aspect-square w-full bg-white border border-gray-200 rounded-xl overflow-hidden group flex items-center justify-center">
          <ProductImg
            src={currentImage}
            alt={`Product View ${activeIndex + 1}`}
            className="w-full h-full object-contain cursor-zoom-in p-4 transition-transform duration-300 group-hover:scale-105"
            onClick={() => setIsLightboxOpen(true)}
          />

          {/* Zoom button */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="absolute bottom-3 right-3 bg-black/70 hover:bg-[#E63012] backdrop-blur-sm text-white w-9 h-9 flex items-center justify-center transition-all focus:outline-none z-10 rounded-lg"
            aria-label="Agrandir l'image"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>

          {/* Nav arrows — visible on mobile, hover on desktop */}
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#E63012] hover:text-white text-gray-700 p-2 rounded-full border border-gray-200 shadow-md transition-all focus:outline-none md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center"
                aria-label="Image précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#E63012] hover:text-white text-gray-700 p-2 rounded-full border border-gray-200 shadow-md transition-all focus:outline-none md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center"
                aria-label="Image suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Dot indicators on mobile */}
          {galleryImages.length > 1 && (
            <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {galleryImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`rounded-full transition-all ${
                    activeIndex === idx
                      ? 'w-4 h-1.5 bg-[#E63012]'
                      : 'w-1.5 h-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4" onClick={() => setIsLightboxOpen(false)}>
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 text-white bg-white/10 hover:bg-white/20 border border-white/20 p-2.5 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-[#E63012] border border-white/20 p-3 rounded-full transition-colors"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <ProductImg
            src={currentImage}
            alt="Vue agrandie"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-[#E63012] border border-white/20 p-3 rounded-full transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Lightbox dots */}
          {galleryImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {galleryImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                  className={`rounded-full transition-all ${
                    activeIndex === idx ? 'w-5 h-1.5 bg-[#E63012]' : 'w-1.5 h-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
