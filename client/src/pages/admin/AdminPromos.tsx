import React, { useState, useEffect } from 'react';
import { Plus, X, Percent, Trash2, Check, AlertCircle, Loader2, Save } from 'lucide-react';
import api from '../../lib/api.ts';
import AdminLayout from '../../components/admin/AdminLayout.tsx';
import { Product } from '../../types/product.ts';

export const AdminPromos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'bundles'>('coupons');
  const [isLoading, setIsLoading] = useState(true);

  // Vouchers state
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountVal, setDiscountVal] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Bundles state
  const [bundles, setBundles] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isBundleFormOpen, setIsBundleFormOpen] = useState(false);
  const [bundleName, setBundleName] = useState('');
  const [bundleDiscount, setBundleDiscount] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPromosData();
  }, []);

  const loadPromosData = async () => {
    setIsLoading(true);
    try {
      const [couponsRes, bundlesRes, productsRes] = await Promise.all([
        api.get('/admin/promo-codes'),
        api.get('/admin/bundles'),
        api.get('/admin/products')
      ]);
      setCoupons(couponsRes.data || []);
      setBundles(bundlesRes.data || []);
      setProductsList(productsRes.data || []);
    } catch (err) {
      console.error('Error fetching admin promos data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!couponCode || !discountVal) {
      setFormError('Veuillez remplir le code et la valeur de la remise.');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/admin/promo-codes', {
        code: couponCode.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountVal),
        min_order: minOrder ? parseFloat(minOrder) : 0,
        usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
        expires_at: expiryDate || null
      });

      setIsCouponFormOpen(false);
      setCouponCode('');
      setDiscountVal('');
      setMinOrder('');
      setUsageLimit('');
      setExpiryDate('');
      loadPromosData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Erreur lors de la création du code promo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBundleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!bundleName || !bundleDiscount || selectedProductIds.length < 2) {
      setFormError('Veuillez spécifier le nom, le pourcentage et sélectionner au moins 2 produits.');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/admin/bundles', {
        name: bundleName,
        discount_percent: parseFloat(bundleDiscount),
        product_ids: selectedProductIds
      });

      setIsBundleFormOpen(false);
      setBundleName('');
      setBundleDiscount('');
      setSelectedProductIds([]);
      loadPromosData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Erreur lors de la création du pack.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce code promo ?')) return;
    try {
      await api.delete(`/admin/promo-codes/${id}`);
      loadPromosData();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      alert('Erreur lors de la suppression du coupon.');
    }
  };

  const handleDeleteBundle = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce pack (bundle) ?')) return;
    try {
      await api.delete(`/admin/bundles/${id}`);
      loadPromosData();
    } catch (err) {
      console.error('Error deleting bundle:', err);
      alert('Erreur lors de la suppression du pack.');
    }
  };

  const handleProductSelect = (id: number) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(prev => prev.filter(pId => pId !== id));
    } else {
      setSelectedProductIds(prev => [...prev, id]);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Title and navigation */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-20 -mx-8 px-8 pt-4">
          <div>
            <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">Promotions & Bundles</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Gérez les coupons et configurez le moteur d'upsells (frequently bought together).</p>
          </div>
          <button
            onClick={() => activeTab === 'coupons' ? setIsCouponFormOpen(true) : setIsBundleFormOpen(true)}
            className="bg-[#E63012] hover:bg-white hover:text-black text-white px-6 py-3.5 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all duration-300 inline-flex items-center space-x-2 shadow-[0_0_15px_rgba(230,48,18,0.3)]"
          >
            <Plus className="w-4 h-4 stroke-[2.5px]" />
            <span>{activeTab === 'coupons' ? 'Ajouter Coupon' : 'Ajouter Pack'}</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('coupons')}
            className={`pb-4 font-display font-black text-sm uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'coupons' ? 'border-[#E63012] text-white' : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            Codes Promo (Coupons)
          </button>
          <button
            onClick={() => setActiveTab('bundles')}
            className={`pb-4 font-display font-black text-sm uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'bundles' ? 'border-[#E63012] text-white' : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            Packs Économies (Bundles)
          </button>
        </div>

        {/* LIST TABLES VIEW */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-[#E63012]" />
          </div>
        ) : activeTab === 'coupons' ? (
          
          /* COUPONS TABLE */
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-800 bg-black/40 text-gray-400 font-mono uppercase tracking-widest">
                    <th className="p-5">Code</th>
                    <th className="p-5">Type Remise</th>
                    <th className="p-5">Valeur</th>
                    <th className="p-5 text-right">Min Commande</th>
                    <th className="p-5 text-center">Utilisé / Limite</th>
                    <th className="p-5 text-center">Date d'expiration</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-5 font-mono font-bold text-[#E63012] tracking-widest text-sm">{c.code}</td>
                      <td className="p-5 text-gray-400 font-black uppercase text-[10px] tracking-widest">{c.discount_type}</td>
                      <td className="p-5 text-white font-mono font-bold text-sm">
                        {c.discount_type === 'percent' ? `${c.discount_value}%` : `${c.discount_value} DH`}
                      </td>
                      <td className="p-5 text-right font-mono text-gray-400 font-bold">{c.min_order} DH</td>
                      <td className="p-5 text-center text-gray-400 font-mono">
                        {c.used_count} / {c.usage_limit || '∞'}
                      </td>
                      <td className="p-5 text-center text-gray-400 font-mono">
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString('fr-MA') : 'Aucune'}
                      </td>
                      <td className="p-5 text-right">
                        <button 
                          onClick={() => handleDeleteCoupon(c.id)} 
                          className="p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-500 border border-gray-700 hover:border-red-500 rounded-lg transition-all ml-auto block"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-gray-500 font-medium">
                        Aucun coupon configuré.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          
          /* BUNDLES TABLE */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((b) => (
              <div key={b.id} className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-[#E63012] transition-colors relative group shadow-lg">
                <div className="absolute -top-3 -right-3 bg-[#E63012] text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-lg rotate-3 group-hover:rotate-6 transition-transform">
                  -{b.discount_percent}% Off
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-wider mb-1 pr-10">{b.name}</h3>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">ID PACK: #{b.id}</p>
                </div>

                <div className="space-y-3 pt-4 mt-4 border-t border-gray-800/50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Produits associés :</p>
                  <ul className="space-y-2">
                    {b.products?.map((bp: any) => (
                      <li key={bp.id} className="flex items-center space-x-3 bg-black/40 rounded-lg p-2 border border-gray-800">
                        <span className="w-1.5 h-6 bg-[#E63012] rounded-full shrink-0"></span>
                        <span className="truncate text-xs font-bold text-gray-300">{bp.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-800/50 flex justify-end">
                  <button 
                    onClick={() => handleDeleteBundle(b.id)} 
                    className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Supprimer</span>
                  </button>
                </div>
              </div>
            ))}
            {bundles.length === 0 && !isLoading && (
              <div className="col-span-full p-10 text-center text-gray-500 font-medium bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl">
                Aucun pack configuré.
              </div>
            )}
          </div>
        )}

        {/* ADD COUPON MODAL OVERLAY */}
        {isCouponFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center border-b border-gray-800 pb-5 mb-6">
                <h2 className="font-display font-black text-xl uppercase tracking-widest text-white flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-[#E63012] rounded-full inline-block"></span>
                  Créer un Code Promo
                </h2>
                <button onClick={() => setIsCouponFormOpen(false)} className="text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 hover:bg-white/5 p-2 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-bold flex items-center space-x-3 mb-6 shadow-inner">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCouponSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Code de réduction *</label>
                  <input type="text" required placeholder="Ex: ETE2025" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] uppercase font-mono tracking-widest font-bold" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type de remise</label>
                    <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] font-bold appearance-none cursor-pointer">
                      <option value="percent">Pourcentage (%)</option>
                      <option value="fixed">Montant Fixe (DH)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valeur remise *</label>
                    <input type="number" required placeholder="Ex: 10 ou 50" value={discountVal} onChange={e => setDiscountVal(e.target.value)} className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] font-mono font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commande minimum (DH)</label>
                    <input type="number" placeholder="Ex: 500" value={minOrder} onChange={e => setMinOrder(e.target.value)} className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] font-mono font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Limite d'utilisation</label>
                    <input type="number" placeholder="Ex: 100" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] font-mono font-bold" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date d'expiration</label>
                  <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] font-mono" style={{ colorScheme: 'dark' }} />
                </div>

                <div className="pt-6 border-t border-gray-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCouponFormOpen(false)}
                    className="px-6 py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#E63012] hover:bg-white hover:text-black text-white px-8 py-3.5 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all inline-flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(230,48,18,0.3)] disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5px]" />}
                    <span>Créer Coupon</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* ADD BUNDLE MODAL OVERLAY */}
        {isBundleFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center border-b border-gray-800 pb-5 mb-6">
                <h2 className="font-display font-black text-xl uppercase tracking-widest text-white flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-[#E63012] rounded-full inline-block"></span>
                  Créer Pack Combiné
                </h2>
                <button onClick={() => setIsBundleFormOpen(false)} className="text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 hover:bg-white/5 p-2 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-bold flex items-center space-x-3 mb-6 shadow-inner">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleBundleSubmit} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom du pack *</label>
                    <input type="text" required placeholder="Ex: Pack Aventure complet" value={bundleName} onChange={e => setBundleName(e.target.value)} className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remise % *</label>
                    <input type="number" required placeholder="Ex: 15" value={bundleDiscount} onChange={e => setBundleDiscount(e.target.value)} className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] text-center font-mono font-bold" />
                  </div>
                </div>

                {/* Multiselect checkboxes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Associer des produits (Sélectionnez min 2) *</label>
                  <div className="bg-black border border-gray-800 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                    {productsList.map(prod => (
                      <label key={prod.id} className="flex items-center space-x-3 text-sm text-gray-300 font-medium cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-gray-800">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(prod.id)}
                          onChange={() => handleProductSelect(prod.id)}
                          className="w-4 h-4 text-[#E63012] bg-gray-900 border-gray-700 rounded focus:ring-[#E63012] focus:ring-offset-gray-900"
                        />
                        <span className="truncate">{prod.name} <span className="text-gray-500 font-mono text-xs ml-1">({prod.brand_name})</span></span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBundleFormOpen(false)}
                    className="px-6 py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#E63012] hover:bg-white hover:text-black text-white px-8 py-3.5 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all inline-flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(230,48,18,0.3)] disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5px]" />}
                    <span>Créer Bundle</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminPromos;
