import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Loader2, Info, Monitor } from 'lucide-react';
import { useAuthStore } from '../../store/auth.ts';
import api from '../../lib/api.ts';
import SEOHead from '../../components/seo/SEOHead.tsx';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mobile bypass state
  const [bypassMobileLock, setBypassMobileLock] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Veuillez remplir tous les champs.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      const { accessToken, refreshToken, user: userData } = res.data;

      if (userData.role !== 'admin') {
        setErrorMsg('Accès refusé. Cet espace est réservé aux administrateurs.');
        return;
      }

      setAuth(accessToken, refreshToken, userData);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Email ou mot de passe incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#0A0A0A] to-black">
      <SEOHead
        title="Connexion Administration | MOTO PACO"
        description="Espace d'administration réservé à l'équipe MOTO PACO."
      />

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#E63012]/10 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]"></div>
      </div>

      {/* Mobile view warning message */}
      <div className="lg:hidden fixed inset-0 bg-[#0A0A0A] z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <Monitor className="w-16 h-16 text-[#E63012] animate-bounce" />
        <h2 className="font-display font-black text-2xl tracking-wide text-white uppercase">ACCÈS BUREAU REQUIS</h2>
        <p className="text-sm text-gray-400 max-w-sm leading-relaxed font-body">
          L'espace d'administration nécessite un écran d'ordinateur pour des raisons de lisibilité et de confort de gestion.
        </p>
        <button
          onClick={() => {
            // Bypass lock
            const el = document.getElementById('mobile-lock-layer');
            if (el) el.style.display = 'none';
            setBypassMobileLock(true);
          }}
          className="bg-transparent border border-gray-700 hover:border-[#E63012] text-white px-6 py-3 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all hover:bg-white/5"
        >
          Déverrouiller temporairement
        </button>
      </div>

      <div id="mobile-lock-layer" className="max-w-md w-full bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-10 space-y-8 shadow-2xl relative z-10">
        <div className="text-center space-y-3">
          <span className="font-display font-black italic text-4xl tracking-tighter">
            <span className="text-[#E63012]">MOTO</span>
            <span className="text-white ml-1">PACO</span>
          </span>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ESPACE ADMINISTRATION</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-bold flex items-center space-x-3 shadow-inner">
            <Info className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">EMAIL ADMINISTRATEUR</label>
            <div className="relative">
              <Mail className="absolute left-4 top-4 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@motopaco.com"
                className="bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white w-full focus:outline-none focus:border-[#E63012] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MOT DE PASSE</label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-black border border-gray-800 rounded-xl pl-12 pr-12 py-3.5 text-sm text-white w-full focus:outline-none focus:border-[#E63012] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#E63012] hover:bg-white hover:text-black text-white py-4 rounded-xl font-display text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(230,48,18,0.3)] disabled:opacity-50 mt-4"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>SE CONNECTER</span>}
          </button>
        </form>

        <p className="text-[10px] text-center text-gray-600 font-mono leading-relaxed pt-4 border-t border-gray-800">
          Accès restreint aux utilisateurs possédant des droits d'administration.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
