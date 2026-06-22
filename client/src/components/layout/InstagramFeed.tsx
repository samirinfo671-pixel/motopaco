import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    imageUrl: "/uploads/instagram-1.png",
    link: "https://www.instagram.com/moto__paco/",
    caption: "Le casque AGV K6 S Carbon, ultra léger et résistant. Parfait pour vos sorties sportives et roadtrips au Maroc ! 🏍️🇲🇦 #AGV #AGVK6S #MotoPaco",
    likes: 248,
    comments: 19
  },
  {
    id: "2",
    imageUrl: "/uploads/instagram-2.png",
    link: "https://www.instagram.com/moto__paco/",
    caption: "Style et sécurité avec le blouson cuir Dainese Racing 4. Venez l'essayer dans notre showroom ! 🏍️✨ #Dainese #DaineseCrew #MotoPaco #EquipementMotard",
    likes: 194,
    comments: 12
  },
  {
    id: "3",
    imageUrl: "/uploads/instagram-3.png",
    link: "https://www.instagram.com/moto__paco/",
    caption: "Notre showroom est prêt pour vous accueillir avec les meilleures marques d'équipement motard au Maroc ! 🏪🏍️ #MotoPaco #SharkHelmets #Shoei #AGV #Alpinestars",
    likes: 312,
    comments: 28
  },
  {
    id: "4",
    imageUrl: "/uploads/instagram-4.png",
    link: "https://www.instagram.com/moto__paco/",
    caption: "Rien ne vaut une virée dans les routes de l'Atlas marocain. Équipez-vous pour l'aventure ! 🏔️🏍️ #AtlasMorocco #Roadtrip #Yamaha #Tenere #MotoPaco",
    likes: 420,
    comments: 35
  },
  {
    id: "5",
    imageUrl: "/uploads/instagram-5.png",
    link: "https://www.instagram.com/moto__paco/",
    caption: "Libérez la puissance et le son de votre machine avec les lignes d'échappement complètes Akrapovič. 🔊🔥 #Akrapovic #Tmax560 #AkrapovicSound #MotoPaco",
    likes: 287,
    comments: 22
  },
  {
    id: "6",
    imageUrl: "/uploads/instagram-6.png",
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

  // Parse instagram posts from global settings
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
      // Small buffer to avoid float inaccuracies
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', updateArrows);
      // Initial check
      updateArrows();
      // Recalculate on window resize
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
    <section className="bg-black py-16 text-white overflow-hidden relative border-t-4 border-[#E63012]">
      {/* Absolute Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-950/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-900/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="text-center md:text-left">
            <span className="text-[#E63012] font-mono text-xs font-black tracking-[0.2em] uppercase mb-2 block">
              INSTAGRAM SHOWCASE
            </span>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h2 className="text-3xl font-black italic tracking-wide uppercase font-display text-white">
                REJOIGNEZ LA MEUTE
              </h2>
              <span className="hidden sm:inline-block text-gray-700">|</span>
              <a 
                href="https://www.instagram.com/moto__paco/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors duration-300 font-black text-sm italic uppercase tracking-wider group"
              >
                <Instagram className="w-4 h-4 text-[#E63012] group-hover:scale-110 transition-transform" />
                @moto__paco
              </a>
            </div>
            <p className="text-gray-400 text-xs mt-2 max-w-lg font-medium leading-relaxed">
              Découvrez nos nouveautés en action, nos crash tests, les shooting de nos clients et nos promotions exclusives au Maroc.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* CTA Button */}
            <a 
              href="https://www.instagram.com/moto__paco/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#E63012] hover:bg-white hover:text-black text-white px-6 py-3.5 font-display text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-[0_4px_20px_rgba(230,48,18,0.25)] hover:shadow-[0_4px_25px_rgba(255,255,255,0.2)] flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <Instagram className="w-4 h-4" />
              <span>SUIVRE SUR INSTAGRAM</span>
            </a>

            {/* Slider Navigation (only on desktop/large screens) */}
            <div className="hidden sm:flex items-center gap-2">
              <button 
                onClick={() => scroll('left')}
                disabled={!showLeftArrow}
                className={`w-10 h-10 border border-gray-800 rounded-none flex items-center justify-center transition-all ${
                  showLeftArrow 
                    ? 'hover:border-[#E63012] hover:bg-[#E63012] text-white' 
                    : 'text-gray-600 border-gray-900 cursor-not-allowed'
                }`}
                aria-label="Reculer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scroll('right')}
                disabled={!showRightArrow}
                className={`w-10 h-10 border border-gray-800 rounded-none flex items-center justify-center transition-all ${
                  showRightArrow 
                    ? 'hover:border-[#E63012] hover:bg-[#E63012] text-white' 
                    : 'text-gray-600 border-gray-900 cursor-not-allowed'
                }`}
                aria-label="Avancer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative group/carousel">
          
          {/* Scrollable list */}
          <div 
            ref={sliderRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-6"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {posts.map((post, idx) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="min-w-[280px] w-[280px] sm:min-w-[340px] sm:w-[340px] aspect-square snap-start bg-zinc-950 border border-zinc-900 overflow-hidden relative group/post"
              >
                {/* Image */}
                <img 
                  src={post.imageUrl} 
                  alt={post.caption} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/post:scale-105"
                  loading="lazy"
                />

                {/* Dark and Glass Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90 opacity-0 group-hover/post:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6 z-10 backdrop-blur-[2px]">
                  
                  {/* Top: Icon link */}
                  <div className="flex justify-between items-center">
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
                      <Instagram className="w-4.5 h-4.5 text-[#E63012]" />
                    </span>
                    <a 
                      href={post.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-[#E63012] flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase bg-white/10 px-2.5 py-1 rounded backdrop-blur-md transition-colors"
                    >
                      Voir le post <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Middle: Caption */}
                  <p className="text-gray-200 text-xs sm:text-[13px] leading-relaxed line-clamp-3 font-medium my-4 italic">
                    &ldquo;{post.caption}&rdquo;
                  </p>

                  {/* Bottom: Likes & Comments */}
                  <div className="flex items-center gap-6 pt-3 border-t border-white/10 text-white font-mono text-xs">
                    <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                      <MessageCircle className="w-4 h-4 text-gray-300" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>

                {/* Micro-interactive link wrapper */}
                <a 
                  href={post.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="absolute inset-0 z-20"
                  aria-label="Ouvrir le post Instagram"
                />
              </motion.div>
            ))}
          </div>

          {/* Gradients on sides for sleek scrolling feel */}
          <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none z-10 opacity-60 sm:block hidden" />
          <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none z-10 opacity-60 sm:block hidden" />
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
