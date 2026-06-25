import React, { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import api from '../../lib/api.ts';
import AdminLayout from '../../components/admin/AdminLayout.tsx';

interface InstagramPost {
  id: string;
  imageUrl: string;
  link: string;
  caption: string;
  likes: number;
  comments: number;
}

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    hero_desktop_image: '',
    hero_mobile_image: '',
    hero_link: '/boutique',
    home_featured_limit: '8',
    home_new_arrivals_limit: '8'
  });
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputDesktopRef = useRef<HTMLInputElement>(null);
  const fileInputMobileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Sync instagramPosts when settings loads
  useEffect(() => {
    if (settings.instagram_posts) {
      try {
        setInstagramPosts(JSON.parse(settings.instagram_posts));
      } catch (e) {
        console.error("Failed to parse instagram posts settings", e);
      }
    }
  }, [settings.instagram_posts]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(prev => ({ ...prev, ...res.data }));
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedSettings = {
        ...settings,
        instagram_posts: JSON.stringify(instagramPosts)
      };
      await api.put('/admin/settings', updatedSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPost = () => {
    const newPost: InstagramPost = {
      id: Date.now().toString(),
      imageUrl: '',
      link: 'https://www.instagram.com/moto__paco/',
      caption: '',
      likes: 0,
      comments: 0
    };
    setInstagramPosts([...instagramPosts, newPost]);
  };

  const handleDeletePost = (index: number) => {
    setInstagramPosts(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostChange = (index: number, field: keyof InstagramPost, value: any) => {
    setInstagramPosts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    setIsLoading(true);
    try {
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setInstagramPosts(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], imageUrl: res.data.url };
        return updated;
      });
    } catch (error) {
      console.error('Failed to upload post image', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    setIsLoading(true);
    try {
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSettings({ ...settings, [key]: res.data.url });
    } catch (error) {
      console.error('Failed to upload image', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-gray-800 pb-6 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-20 -mx-8 px-8 pt-4">
        <div>
          <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">Paramètres du Site</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">Gérez le contenu, les pixels et les coordonnées de votre boutique.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 bg-[#E63012] hover:bg-white hover:text-black text-white px-6 py-3.5 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(230,48,18,0.3)] disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4 stroke-[2.5px]" />}
          <span>{saved ? 'Enregistré !' : 'Enregistrer'}</span>
        </button>
      </div>

      <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="font-display font-black text-lg uppercase tracking-widest text-white mb-6 pb-4 border-b border-gray-800 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-[#E63012] rounded-full inline-block"></span>
          Bannière Hero (Page d'accueil)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Desktop Image */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Image Desktop (Recommandé: 1920x800)</label>
            <div 
              className="border-2 border-dashed border-gray-700 bg-black/40 rounded-xl p-6 text-center cursor-pointer hover:border-[#E63012] hover:bg-white/5 transition-all group"
              onClick={() => fileInputDesktopRef.current?.click()}
            >
              {settings.hero_desktop_image ? (
                <img src={settings.hero_desktop_image} alt="Desktop Hero" className="h-40 mx-auto object-cover rounded-lg border border-gray-700 shadow-lg" />
              ) : (
                <div className="py-6">
                  <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-3 group-hover:text-[#E63012] transition-colors" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cliquez pour uploader</p>
                </div>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputDesktopRef}
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'hero_desktop_image')}
            />
          </div>

          {/* Mobile Image */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Image Mobile (Recommandé: 800x1200)</label>
            <div 
              className="border-2 border-dashed border-gray-700 bg-black/40 rounded-xl p-6 text-center cursor-pointer hover:border-[#E63012] hover:bg-white/5 transition-all group"
              onClick={() => fileInputMobileRef.current?.click()}
            >
              {settings.hero_mobile_image ? (
                <img src={settings.hero_mobile_image} alt="Mobile Hero" className="h-40 mx-auto object-cover rounded-lg border border-gray-700 shadow-lg" />
              ) : (
                <div className="py-6">
                  <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-3 group-hover:text-[#E63012] transition-colors" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cliquez pour uploader</p>
                </div>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputMobileRef}
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'hero_mobile_image')}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Lien du bouton / de la bannière</label>
          <input
            type="text"
            value={settings.hero_link || ''}
            onChange={(e) => setSettings({ ...settings, hero_link: e.target.value })}
            placeholder="/boutique ou /categorie/casques"
            className="w-full bg-black border border-gray-700 rounded-lg px-5 py-4 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-mono"
          />
        </div>
      </div>

      <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="font-display font-black text-lg uppercase tracking-widest text-white mb-6 pb-4 border-b border-gray-800 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-[#E63012] rounded-full inline-block"></span>
          Pixels de Suivi (Analytics)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Facebook Pixel ID</label>
            <input
              type="text"
              value={settings.facebook_pixel_id || ''}
              onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })}
              placeholder="Ex: 1029384756"
              className="w-full bg-black border border-gray-700 rounded-lg px-5 py-4 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Google Analytics ID</label>
            <input
              type="text"
              value={settings.google_analytics_id || ''}
              onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
              placeholder="Ex: G-XXXXXXXXXX"
              className="w-full bg-black border border-gray-700 rounded-lg px-5 py-4 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-mono"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="font-display font-black text-lg uppercase tracking-widest text-white mb-6 pb-4 border-b border-gray-800 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-[#E63012] rounded-full inline-block"></span>
          Contact & WhatsApp
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Numéro WhatsApp (Format International)</label>
            <input
              type="text"
              value={settings.whatsapp_number || ''}
              onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
              placeholder="Ex: 212600112233"
              className="w-full bg-black border border-gray-700 rounded-lg px-5 py-4 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-mono"
            />
            <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">Utilisé pour le bouton flottant et la confirmation de commande.</p>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Email de Contact</label>
            <input
              type="email"
              value={settings.contact_email || ''}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
              placeholder="contact@motopaco.com"
              className="w-full bg-black border border-gray-700 rounded-lg px-5 py-4 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Adresse de la Boutique</label>
            <input
              type="text"
              value={settings.store_address || ''}
              onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
              placeholder="Lotissement assaada n92, Ain atiq 12000"
              className="w-full bg-black border border-gray-700 rounded-lg px-5 py-4 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-mono"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="font-display font-black text-lg uppercase tracking-widest text-white mb-6 pb-4 border-b border-gray-800 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-[#E63012] rounded-full inline-block"></span>
          Affichage Page d'accueil
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nombre de Best Sellers (Top Ventes)</label>
            <input
              type="number"
              value={settings.home_featured_limit || '8'}
              onChange={(e) => setSettings({ ...settings, home_featured_limit: e.target.value })}
              placeholder="Ex: 8"
              className="w-full bg-black border border-gray-700 rounded-lg px-5 py-4 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nombre de Nouveautés</label>
            <input
              type="number"
              value={settings.home_new_arrivals_limit || '8'}
              onChange={(e) => setSettings({ ...settings, home_new_arrivals_limit: e.target.value })}
              placeholder="Ex: 8"
              className="w-full bg-black border border-gray-700 rounded-lg px-5 py-4 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* Instagram Showcase */}
      <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
          <h2 className="font-display font-black text-lg uppercase tracking-widest text-white flex items-center gap-3">
            <span className="w-1.5 h-6 bg-[#E63012] rounded-full inline-block"></span>
            Instagram Showcase
          </h2>
          <button
            type="button"
            onClick={handleAddPost}
            className="bg-[#E63012] hover:bg-white hover:text-black text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all"
          >
            + AJOUTER UN POST
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instagramPosts.map((post, index) => (
            <div key={post.id} className="bg-black/60 border border-gray-800 rounded-xl p-5 space-y-4 relative group">
              <button
                type="button"
                onClick={() => handleDeletePost(index)}
                className="absolute top-3 right-3 bg-red-950 text-red-500 hover:bg-red-500 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition-all"
              >
                Supprimer
              </button>

              <div className="flex gap-4">
                {/* Thumbnail upload area */}
                <div 
                  className="w-24 h-24 bg-gray-900 border border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#E63012] overflow-hidden shrink-0 relative"
                  onClick={() => {
                    const el = document.getElementById(`post-img-input-${index}`);
                    el?.click();
                  }}
                >
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt="Insta preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2 text-gray-500">
                      <span className="text-lg">📷</span>
                      <p className="text-[8px] font-bold uppercase mt-1">Image</p>
                    </div>
                  )}
                  <input
                    id={`post-img-input-${index}`}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handlePostImageUpload(e, index)}
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Likes</label>
                    <input
                      type="number"
                      value={post.likes}
                      onChange={(e) => handlePostChange(index, 'likes', parseInt(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Comments</label>
                    <input
                      type="number"
                      value={post.comments}
                      onChange={(e) => handlePostChange(index, 'comments', parseInt(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Lien Instagram</label>
                <input
                  type="text"
                  value={post.link}
                  onChange={(e) => handlePostChange(index, 'link', e.target.value)}
                  placeholder="https://instagram.com/p/..."
                  className="w-full bg-black/40 border border-gray-700 rounded px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Légende (Caption)</label>
                <textarea
                  value={post.caption}
                  onChange={(e) => handlePostChange(index, 'caption', e.target.value)}
                  placeholder="Ex: Le nouveau casque AGV..."
                  rows={3}
                  className="w-full bg-black/40 border border-gray-700 rounded px-3 py-2 text-xs text-white resize-none"
                />
              </div>
            </div>
          ))}
          {instagramPosts.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
              Aucun post configuré. Cliquez sur "+ AJOUTER UN POST" ci-dessus.
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 mb-10 shadow-2xl">
        <h2 className="font-display font-black text-lg uppercase tracking-widest text-white mb-6 pb-4 border-b border-gray-800 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-[#E63012] rounded-full inline-block"></span>
          SEO Global
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Titre du Site (Méta Titre)</label>
            <input
              type="text"
              value={settings.seo_title || ''}
              onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })}
              placeholder="MOTO PACO - Équipement & Accessoires Moto"
              className="w-full bg-black border border-gray-700 rounded-lg px-5 py-4 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Description du Site (Méta Description)</label>
            <textarea
              value={settings.seo_description || ''}
              onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })}
              placeholder="Votre boutique n°1 au Maroc pour..."
              rows={4}
              className="w-full bg-black border border-gray-700 rounded-lg px-5 py-4 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-mono custom-scrollbar"
            />
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};
