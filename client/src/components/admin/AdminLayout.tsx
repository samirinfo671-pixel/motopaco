import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, CreditCard, Percent, Layers, BarChart3, LogOut, Globe, Monitor, ShieldAlert, Settings, FolderTree, Tag, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/auth.ts';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [bypassLock, setBypassLock] = useState(false);

  // Authenticate role gate on mount
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E7EB] flex selection:bg-[#E63012] selection:text-white font-body">
      
      {/* Mobile-screen width check block overlay */}
      {!bypassLock && (
        <div className="lg:hidden fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-xl z-[999] flex flex-col items-center justify-center p-6 text-center space-y-6">
          <Monitor className="w-16 h-16 text-[#E63012] animate-pulse" />
          <h2 className="font-display font-black text-2xl tracking-wide text-white uppercase">ACCÈS BUREAU REQUIS</h2>
          <p className="text-sm text-gray-400 max-w-sm leading-relaxed font-medium">
            L'espace d'administration nécessite un écran d'ordinateur pour des raisons de lisibilité et de confort de gestion.
          </p>
          <button
            onClick={() => setBypassLock(true)}
            className="bg-transparent border border-gray-700 hover:border-[#E63012] hover:bg-[#E63012]/10 text-white px-8 py-3 rounded font-display text-xs font-black uppercase tracking-widest transition-all duration-300"
          >
            Déverrouiller temporairement
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#111827]/80 backdrop-blur-2xl border-r border-gray-800 flex flex-col justify-between hidden lg:flex shrink-0 shadow-2xl relative z-50">
        <div className="p-6">
          <Link to="/admin/dashboard" className="flex items-center select-none mb-10 cursor-pointer">
            <img src="/logo-white.png" alt="MOTO PACO" className="h-9 w-auto object-contain" />
          </Link>

          <nav className="space-y-1.5">
            {[
              { to: "/admin/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
              { to: "/admin/categories", icon: FolderTree, label: "Catégories" },
              { to: "/admin/brands", icon: Tag, label: "Marques" },
              { to: "/admin/products", icon: ShoppingBag, label: "Produits" },
              { to: "/admin/orders", icon: CreditCard, label: "Commandes" },
              { to: "/admin/promos", icon: Percent, label: "Codes Promo" },
              { to: "/admin/stock", icon: Layers, label: "Stock" },
              { to: "/admin/settings", icon: Settings, label: "Paramètres" },
              { to: "/admin/wordpress-import", icon: RefreshCw, label: "Import WordPress" },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#E63012]/20 to-transparent text-white border border-[#E63012]/30 shadow-[inset_2px_0_0_#E63012]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-gray-800/50 space-y-2">
          <Link
            to="/boutique"
            className="group flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
          >
            <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
            <span>Voir le site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="group flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-[#E63012] hover:bg-[#E63012]/10 transition-all duration-300 w-full text-left"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 bg-[#0A0A0A] relative overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#111827] to-[#0A0A0A] pointer-events-none z-0"></div>
        <div className="max-w-[1600px] mx-auto p-8 relative z-10 min-h-full">
          {children}
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;
