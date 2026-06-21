import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { initPixels, trackPageView } from './lib/pixels.ts';
import { useSettingsStore } from './store/settings.ts';
import { SEOHead } from './components/seo/SEOHead.tsx';

// Layout components
import Header from './components/layout/Header.tsx';
import Footer from './components/layout/Footer.tsx';
import MobileNav from './components/layout/MobileNav.tsx';
import CartDrawer from './components/cart/CartDrawer.tsx';
import WhatsAppFloat from './components/layout/WhatsAppFloat.tsx';

// Public pages
import Home from './pages/Home.tsx';
import Boutique from './pages/Boutique.tsx';
import Categorie from './pages/Categorie.tsx';
import Marque from './pages/Marque.tsx';
import Produit from './pages/Produit.tsx';
import Panier from './pages/Panier.tsx';
import Commande from './pages/Commande.tsx';
import Confirmation from './pages/Confirmation.tsx';
import Compte from './pages/Compte.tsx';
import Contact from './pages/Contact.tsx';
import NotFound from './pages/NotFound.tsx';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin.tsx';
import AdminDashboard from './pages/admin/AdminDashboard.tsx';
import AdminProducts from './pages/admin/AdminProducts.tsx';
import AdminOrders from './pages/admin/AdminOrders.tsx';
import AdminPromos from './pages/admin/AdminPromos.tsx';
import AdminStock from './pages/admin/AdminStock.tsx';
import { AdminSettings } from './pages/admin/AdminSettings.tsx';
import { AdminCategories } from './pages/admin/AdminCategories.tsx';
import { AdminBrands } from './pages/admin/AdminBrands.tsx';
import { AdminWordPressImport } from './pages/admin/AdminWordPressImport.tsx';

// Scroll to top and track page view on navigation
const ScrollToTopAndTrack: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Capture UTM source if present
    const params = new URLSearchParams(search);
    const source = params.get('utm_source') || params.get('source') || params.get('ref');
    if (source && !localStorage.getItem('packmoto_source')) {
      localStorage.setItem('packmoto_source', source);
    }
    
    // Also track referrer on first visit
    if (!localStorage.getItem('packmoto_source') && document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.hostname !== window.location.hostname) {
          localStorage.setItem('packmoto_source', refUrl.hostname);
        }
      } catch (e) {
        // ignore invalid URL
      }
    }

    window.scrollTo(0, 0);
    trackPageView(pathname);
  }, [pathname, search]);

  return null;
};

// Helper redirect component to preserve search parameters (e.g. ?type=integral)
const CategoryRedirect: React.FC<{ to: string }> = ({ to }) => {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
};

// Conditional Layout Wrapper
const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isNotFound = ![
    '/', '/boutique', '/panier', '/commande', '/confirmation', '/compte', '/contact'
  ].includes(location.pathname) && 
  !location.pathname.startsWith('/categorie') && 
  !location.pathname.startsWith('/marque') && 
  !location.pathname.startsWith('/produit') &&
  !isAdminRoute;

  // Do not render header/footer on admin pages or 404 pages
  if (isAdminRoute || isNotFound) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow">{children}</div>
      <CartDrawer />
      <WhatsAppFloat />
      <MobileNav />
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  const { settings, fetchSettings, isLoading } = useSettingsStore();

  // Fetch global settings and init pixels on mount
  useEffect(() => {
    fetchSettings().then(() => {
      // The store is updated, but the local variable 'settings' might not be fresh in this promise.
      // We will init pixels in another useEffect that watches settings.
    });
  }, [fetchSettings]);

  useEffect(() => {
    if (!isLoading) {
      initPixels({
        meta: settings.facebook_pixel_id,
        gtm: settings.google_analytics_id
        // add tiktok, snap if they become available
      });
    }
  }, [isLoading, settings.facebook_pixel_id, settings.google_analytics_id]);

  return (
    <HelmetProvider>
      {settings.seo_title && (
        <SEOHead 
          title={settings.seo_title} 
          description={settings.seo_description || 'MOTO PACO - Équipement & Accessoires Moto au Maroc'}
        />
      )}
      <BrowserRouter>
        <ScrollToTopAndTrack />
        <ClientLayout>
          <Routes>
            {/* Public Customer Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/boutique" element={<Boutique />} />
            {/* Category Redirects for WooCommerce Slugs Normalization */}
            <Route path="/categorie/casques" element={<CategoryRedirect to="/categorie/casques-moto" />} />
            <Route path="/categorie/vestes-blousons" element={<CategoryRedirect to="/categorie/jackets" />} />
            <Route path="/categorie/gants" element={<CategoryRedirect to="/categorie/gants-moto" />} />
            <Route path="/categorie/bottes" element={<CategoryRedirect to="/categorie/bottes-moto" />} />
            <Route path="/categorie/pantalons" element={<CategoryRedirect to="/categorie/pantalon-moto" />} />
            <Route path="/categorie/bagagerie" element={<CategoryRedirect to="/categorie/bagagerie-moto" />} />
            <Route path="/categorie/sacoches" element={<CategoryRedirect to="/categorie/sac" />} />
            <Route path="/categorie/protections" element={<CategoryRedirect to="/categorie/pieces-accessoires" />} />
            <Route path="/categorie/accessoires-usb" element={<CategoryRedirect to="/categorie/support-pour-telephone-portable" />} />
            <Route path="/categorie/kit-chaine" element={<CategoryRedirect to="/categorie/pieces-accessoires" />} />
            <Route path="/categorie/echappements" element={<CategoryRedirect to="/categorie/pieces-accessoires" />} />

            <Route path="/categorie/:slug" element={<Categorie />} />
            <Route path="/marque/:slug" element={<Marque />} />
            <Route path="/produit/:slug" element={<Produit />} />
            <Route path="/panier" element={<Panier />} />
            <Route path="/commande" element={<Commande />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/compte" element={<Compte />} />
            <Route path="/contact" element={<Contact />} />

            {/* Secure Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/brands" element={<AdminBrands />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/promos" element={<AdminPromos />} />
            <Route path="/admin/stock" element={<AdminStock />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/wordpress-import" element={<AdminWordPressImport />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ClientLayout>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;
