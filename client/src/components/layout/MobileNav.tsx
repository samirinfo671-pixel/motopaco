import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Search, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '../../store/cart.ts';
import { useUIStore } from '../../store/ui.ts';

export const MobileNav: React.FC = () => {
  const { items } = useCartStore();
  const { setCartOpen } = useUIStore();

  const cartQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full bg-[#FFFFFF]/95 border-t border-[#E5E7EB] backdrop-blur-lg z-50 py-2.5 px-4 shadow-2xl flex items-center justify-around">
      
      {/* Home Tab */}
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center space-y-1 transition-colors ${
            isActive ? 'text-[#E63012]' : 'text-[#4B5563] hover:text-[#111827]'
          }`
        }
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-bold tracking-wider">ACCUEIL</span>
      </NavLink>

      {/* Catalog / Shop Tab */}
      <NavLink
        to="/boutique"
        className={({ isActive }) =>
          `flex flex-col items-center space-y-1 transition-colors ${
            isActive ? 'text-[#E63012]' : 'text-[#4B5563] hover:text-[#111827]'
          }`
        }
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px] font-bold tracking-wider">BOUTIQUE</span>
      </NavLink>

      {/* Search Trigger */}
      <NavLink
        to="/boutique?focus=search"
        className="flex flex-col items-center space-y-1 text-[#4B5563] hover:text-[#111827] transition-colors"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-bold tracking-wider">RECHERCHE</span>
      </NavLink>

      {/* Shopping Cart Trigger */}
      <button
        onClick={() => setCartOpen(true)}
        className="flex flex-col items-center space-y-1 text-[#4B5563] hover:text-[#111827] transition-colors relative"
        aria-label="Voir le Panier"
      >
        <ShoppingBag className="w-5 h-5" />
        {cartQuantity > 0 && (
          <span className="absolute -top-1 right-2.5 bg-[#E63012] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-[#FFFFFF]">
            {cartQuantity}
          </span>
        )}
        <span className="text-[10px] font-bold tracking-wider">PANIER</span>
      </button>

      {/* Profile/Account Tab */}
      <NavLink
        to="/compte"
        className={({ isActive }) =>
          `flex flex-col items-center space-y-1 transition-colors ${
            isActive ? 'text-[#E63012]' : 'text-[#4B5563] hover:text-[#111827]'
          }`
        }
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-bold tracking-wider">COMPTE</span>
      </NavLink>

    </div>
  );
};

export default MobileNav;
