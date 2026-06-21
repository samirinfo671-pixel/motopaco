import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { ProductImage } from '../../types/product.ts';

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
      if (idx !== -1) {
        setActiveIndex(idx);
      }
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
    <div className="flex flex-col md:flex-row gap-4">
      {/* Thumbnails Row / Column */}
      {galleryImages.length > 1 && (
        <div className="flex flex-row md:flex-col order-2 md:order-1 gap-3 md:w-20 shrink-0 overflow-x-auto md:overflow-x-visible md:overflow-y-auto max-h-[500px] py-1 md:py-0">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-12 h-12 md:w-20 md:h-20 shrink-0 rounded-none overflow-hidden bg-[#FFFFFF] border transition-all ${
                activeIndex === idx 
                  ? 'border-[#E63012] ring-1 ring-[#E63012]' 
                  : 'border-[#E5E7EB] hover:border-[#4B5563]'
              }`}
            >
              <img
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image Frame */}
      <div className="flex-1 order-1 md:order-2">
        <div className="relative aspect-[4/3] md:aspect-square w-full max-h-[280px] md:max-h-none bg-[#FFFFFF] border border-[#E5E7EB] rounded-none overflow-hidden group flex items-center justify-center">
          <img
            src={currentImage}
            alt={`Product View ${activeIndex + 1}`}
            className="w-full h-full object-contain cursor-zoom-in p-2"
            onClick={() => setIsLightboxOpen(true)}
          />

           {/* Lightbox / Zoom Button Overlay */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="absolute bottom-0 right-0 bg-black hover:bg-gray-900 text-white w-9 h-9 flex items-center justify-center transition-colors focus:outline-none z-10 rounded-none"
            aria-label="Agrandir l'image"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>

          {/* Swipe arrows on hover (for multimage) */}
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#F9FAFB]/75 hover:bg-[#E63012] text-[#111827] hover:text-white p-2 rounded-full border border-[#E5E7EB] transition-all focus:outline-none opacity-0 group-hover:opacity-100 flex items-center justify-center"
                aria-label="Image précédente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#F9FAFB]/75 hover:bg-[#E63012] text-[#111827] hover:text-white p-2 rounded-full border border-[#E5E7EB] transition-all focus:outline-none opacity-0 group-hover:opacity-100 flex items-center justify-center"
                aria-label="Image suivante"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lightbox / Zoom Dialog Modal Overlay */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-[#111827] hover:text-white bg-[#FFFFFF] border border-[#E5E7EB] p-2.5 rounded-full"
            aria-label="Fermer la visionneuse"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-black bg-[#FFFFFF] border border-[#E5E7EB] p-3 rounded-full hover:bg-[#E63012] hover:text-white transition-colors"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <img
            src={currentImage}
            alt="Product Zoomed View"
            className="max-w-full max-h-[85vh] object-contain rounded"
          />

          <button
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-black bg-[#FFFFFF] border border-[#E5E7EB] p-3 rounded-full hover:bg-[#E63012] hover:text-white transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

    </div>
  );
};

export default ImageGallery;
