import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Instagram, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useSettingsStore } from '../../store/settings.ts';

interface InstagramPost {
  id: string;
  imageUrl: string;
  link: string;
  caption: string;
  likes: number;
  comments: number;
}

const FALLBACK_POSTS: InstagramPost[] = [
  {
    id: "1",
    imageUrl: "/uploads/social-1.png",
    link: "https://www.instagram.com/moto__paco/",
    caption: "Le casque AGV K6 S Carbon, ultra léger et résistant. Parfait pour vos sorties sportives et roadtrips au Maroc ! 🏍️🇲🇦 #AGV #AGVK6S #MotoPaco",
    likes: 248,
    comments: 19
  },
  {
    id: "2",
    imageUrl: "/uploads/social-2.png",
    link: "https://www.instagram.com/moto__paco/",
    caption: "Style et sécurité avec le blouson cuir Dainese Racing 4. Venez l'essayer dans notre showroom ! 🏍️✨ #Dainese #DaineseCrew #MotoPaco #EquipementMotard",
    likes: 194,
    comments: 12
  },
  {
    id: "3",
    imageUrl: "/uploads/social-3.png",
    link: "https://www.instagram.com/moto__paco/",
    caption: "Notre showroom est prêt pour vous accueillir avec les meilleures marques d'équipement motard au Maroc ! 🏪🏍️ #MotoPaco #SharkHelmets #Shoei #AGV #Alpinestars",
    likes: 312,
    comments: 28
  },
  {
    id: "4",
    imageUrl: "/uploads/social-4.png",
    link: "https://www.instagram.com/moto__paco/",
    caption: "Rien ne vaut une virée dans les routes de l'Atlas marocain. Équipez-vous pour l'aventure ! 🏔️🏍️ #AtlasMorocco #Roadtrip #Yamaha #Tenere #MotoPaco",
    likes: 420,
    comments: 35
  },
  {
    id: "5",
    imageUrl: "/uploads/social-5.png",
    link: "https://www.instagram.com/moto__paco/",
    caption: "Libérez la puissance et le son de votre machine avec les lignes d'échappement complètes Akrapovič. 🔊🔥 #Akrapovic #Tmax560 #AkrapovicSound #MotoPaco",
    likes: 287,
    comments: 22
  },
  {
    id: "6",
    imageUrl: "/uploads/social-6.png",
    link: "https://www.instagram.com/moto__paco/",
    caption: "Les bottes TCX RT-Race et les gants Dainese Carbon : le combo idéal pour la piste et la route. 🏁🧤 #TCXBoots #Dainese #RacingGear #MotoPaco",
    likes: 165,
    comments: 8
  }
];

export const InstagramFeed: React.FC = () => {
  const { settings } = useSettingsStore();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const posts: InstagramPost[] = React.useMemo(() => {
    if (settings.instagram_posts) {
      try {
        return JSON.parse(settings.instagram_posts);
      } catch (e) {
        console.error("Failed to parse instagram posts setting:", e);
      }
    }
    return FALLBACK_POSTS;
  }, [settings.instagram_posts]);

  const updateArrows = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', updateArrows);
      updateArrows();
      window.addEventListener('resize', updateArrows);
    }
    return () => {
      if (slider) {
        slider.removeEventListener('scroll', updateArrows);
      }
      window.removeEventListener('resize', updateArrows);
    };
  }, [posts]);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const { clientWidth } = sliderRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      sliderRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="bg-white py-12 max-w-[1650px] mx-auto px-3 sm:px-4 border-t border-gray-100 overflow-hidden relative">
      <div className="w-full">
        
        {/* Section Header with standard line dividers matching Marques / Catégories Phares */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="w-1 h-[22px] bg-[#E63012] ml-4 mr-3"></div>
          <h2 className="section-title text-center whitespace-nowrap">SUIVEZ-NOUS SUR INSTAGRAM</h2>
          <div className="w-1 h-[22px] bg-[#E63012] ml-3 mr-4"></div>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Account Info and Nav Row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#E63012]/5 flex items-center justify-center border border-[#E63012]/20">
              <Instagram className="w-5 h-5 text-[#E63012]" />
            </div>
            <div>
              <a 
                href="https://www.instagram.com/moto__paco/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-black text-sm uppercase tracking-wider text-gray-900 hover:text-[#E63012] transition-colors flex items-center gap-1 font-display"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                @moto__paco <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <p className="text-[9px] text-gray-500 font-bold tracking-wider uppercase mt-0.5">Communauté Officielle Moto Paco</p>
            </div>
          </div>

          {/* Nav buttons (hidden on mobile, matches Boutique filters) */}
          <div className="hidden sm:flex items-center gap-2">
            <button 
              onClick={() => scroll('left')}
              disabled={!showLeftArrow}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                showLeftArrow 
                  ? 'border-gray-300 bg-white text-gray-800 hover:border-[#E63012] hover:bg-[#E63012] hover:text-white shadow-sm' 
                  : 'text-gray-200 border-gray-100 cursor-not-allowed'
              }`}
              aria-label="Précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => scroll('right')}
              disabled={!showRightArrow}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                showRightArrow 
                  ? 'border-gray-300 bg-white text-gray-800 hover:border-[#E63012] hover:bg-[#E63012] hover:text-white shadow-sm' 
                  : 'text-gray-200 border-gray-100 cursor-not-allowed'
              }`}
              aria-label="Suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Slider */}
        <div className="relative mb-8">
          <div 
            ref={sliderRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
             {posts.map((post, idx) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="min-w-[240px] w-[240px] sm:min-w-[290px] sm:w-[290px] bg-white border border-gray-100 p-3 flex flex-col hover:border-gray-300 hover:shadow-lg transition-all rounded relative group/post snap-start"
              >
                {/* Image Container matching ProductCard style */}
                <div className="relative w-full aspect-square bg-[#F9FAFB] mb-2 overflow-hidden rounded shrink-0">
                  <img 
                    src={post.imageUrl} 
                    alt={post.caption} 
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/post:scale-105"
                    loading="lazy"
                  />

                  {/* Dark and Glass Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/post:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-10 rounded">
                    <div className="flex justify-between items-center w-full">
                      <span className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/10">
                        <Instagram className="w-4 h-4 text-[#E63012]" />
                      </span>
                      <span className="text-white text-[8px] font-black uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded backdrop-blur-md">
                        Instagram
                      </span>
                    </div>

                    <p className="text-gray-200 text-[10px] leading-relaxed line-clamp-4 font-bold my-4 italic text-center px-1">
                      &ldquo;{post.caption}&rdquo;
                    </p>

                    <div className="flex items-center justify-center gap-6 pt-3 border-t border-white/10 text-white font-mono text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-gray-300" />
                        <span>{post.comments}</span>
                      </div>
                    </div>
                  </div>

                  {/* Micro link wrapper */}
                  <a 
                    href={post.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="absolute inset-0 z-20"
                    aria-label="Ouvrir le post Instagram"
                  />
                </div>

                {/* Details Footer: Matches ProductCard style */}
                <div className="flex flex-col flex-1 items-center justify-between text-center px-1 pb-1 mt-2">
                  <div className="w-full flex flex-col items-center">
                    {/* Brand/Username handle */}
                    <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1 block" style={{ color: '#E63012' }}>
                      @moto__paco
                    </span>

                    {/* Post Caption */}
                    <h3
                      className="text-[11px] font-extrabold uppercase leading-snug line-clamp-2 mb-2 min-h-[32px] flex items-center justify-center text-center text-gray-900"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {post.caption}
                    </h3>

                    {/* Social Stats instead of star rating */}
                    <div className="flex items-center justify-center gap-3 mb-3 text-[10px] font-mono text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-[#E63012] fill-[#E63012]" />
                        {post.likes} LIKES
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-gray-400 fill-gray-400" />
                        {post.comments} COMMS
                      </span>
                    </div>
                  </div>

                  {/* Action Link styled like ProductCard bottom trust badge */}
                  <div className="w-full pt-2 border-t border-gray-100 flex items-center justify-center mt-auto">
                    <a 
                      href={post.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[8px] font-black text-gray-600 bg-gray-50 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider hover:bg-[#E63012] hover:text-white transition-colors z-30"
                    >
                      VOIR LE POST <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Big Bottom Follow CTA styled like Boutique buttons */}
        <div className="flex justify-center mt-6">
          <a 
            href="https://www.instagram.com/moto__paco/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-black hover:bg-[#E63012] text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded transition-all hover:scale-105 shadow-md"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <Instagram className="w-4.5 h-4.5 mr-2" />
            REJOINDRE LA COMMUNAUTÉ
          </a>
        </div>

      </div>
    </section>
  );
};

export default InstagramFeed;
