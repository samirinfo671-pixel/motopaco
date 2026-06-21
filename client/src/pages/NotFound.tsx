import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead.tsx';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center relative overflow-hidden px-4">
      <SEOHead
        title="Route Introuvable - 404 | MOTO PACO"
        description="Désolé, cette route n'existe pas ou le produit a été déplacé. Retournez à l'accueil de MOTO PACO."
      />

      {/* Red ambient light blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#E63012]/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="text-center z-10 max-w-lg space-y-6">
        <span className="text-[#E63012] font-mono text-sm font-black tracking-[0.2em] uppercase">
          CODE 404 — HORS PISTE
        </span>
        
        <h1 className="race-livery text-5xl sm:text-7xl text-[#111827] leading-none">
          ROUTE INTROUVABLE
        </h1>

        {/* Animated Tire Track SVG */}
        <div className="py-4 flex justify-center">
          <svg
            className="w-48 h-12 text-[#E5E7EB] animate-pulse"
            viewBox="0 0 200 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="8,6"
          >
            <path d="M10 20C50 20 50 10 90 10C130 10 130 30 170 30" />
            <path d="M10 25C50 25 50 15 90 15C130 15 130 35 170 35" strokeDasharray="3,3" />
          </svg>
        </div>

        <p className="text-sm text-[#4B5563] leading-relaxed max-w-sm mx-auto font-body">
          Oups ! Vous avez mordu sur le bas-côté. La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div className="pt-4">
          <Link
            to="/"
            className="bg-[#E63012] hover:bg-[#111827] text-white px-8 py-4 rounded font-display text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center space-x-2 shadow red-glow"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETOUR À L'ACCUEIL</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
