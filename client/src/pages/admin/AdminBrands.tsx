import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Loader2, Trash2, X, Save, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import AdminLayout from '../../components/admin/AdminLayout';

export const AdminBrands: React.FC = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/admin/brands', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        setBrands(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch brands', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    setIsLoading(true);
    try {
      const isNew = !editingBrand.id;
      const url = isNew ? '/api/admin/brands' : `/api/admin/brands/${editingBrand.id}`;
      const method = isNew ? 'POST' : 'PUT';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(editingBrand)
      });
      setEditingBrand(null);
      fetchBrands();
    } catch (error) {
      console.error('Failed to save brand', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette marque ?')) return;
    try {
      await fetch(`/api/admin/brands/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      fetchBrands();
    } catch (error) {
      console.error('Failed to delete brand', error);
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-20 -mx-8 px-8 pt-4">
          <div>
            <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">Marques</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Gérez les marques de produits (AGV, Shoei, etc.)</p>
          </div>
          <button
            onClick={() => setEditingBrand({ name: '', slug: '', is_featured: 0 })}
            className="bg-[#E63012] hover:bg-white hover:text-black text-white px-6 py-3.5 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all duration-300 inline-flex items-center space-x-2 shadow-[0_0_15px_rgba(230,48,18,0.3)]"
          >
            <Plus className="w-4 h-4 stroke-[2.5px]" />
            <span>Ajouter Marque</span>
          </button>
        </div>

        <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-800 bg-black/40 text-gray-400 font-mono uppercase tracking-widest">
                <th className="p-5">Nom</th>
                <th className="p-5">Slug</th>
                <th className="p-5 text-center">En Vedette</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-5 text-white font-bold text-sm">{brand.name}</td>
                  <td className="p-5 text-gray-400 font-mono">{brand.slug}</td>
                  <td className="p-5 text-center">
                    {brand.is_featured ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-500/20 text-green-400 border border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Oui
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-800/50 text-gray-500 border border-gray-700">
                        Non
                      </span>
                    )}
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingBrand(brand)} 
                        className="p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-[#E63012] border border-gray-700 hover:border-[#E63012] rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(brand.id)} 
                        className="p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-500 border border-gray-700 hover:border-red-500 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-500 font-medium">
                    Aucune marque n'est configurée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {editingBrand && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-gray-800 pb-5 mb-6">
                <h2 className="font-display font-black text-xl uppercase tracking-widest text-white flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-[#E63012] rounded-full inline-block"></span>
                  {editingBrand.id ? 'Modifier la Marque' : 'Nouvelle Marque'}
                </h2>
                <button
                  onClick={() => setEditingBrand(null)}
                  className="text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 hover:bg-white/5 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom de la marque</label>
                  <input
                    type="text"
                    value={editingBrand.name}
                    onChange={e => setEditingBrand({ ...editingBrand, name: e.target.value })}
                    className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] font-bold"
                    placeholder="Ex: AGV"
                    required
                  />
                </div>
                
                {/* Optional Slug Input if they want to edit it */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Slug (Généré auto si vide)</label>
                  <input
                    type="text"
                    value={editingBrand.slug || ''}
                    onChange={e => setEditingBrand({ ...editingBrand, slug: e.target.value })}
                    className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-400 w-full focus:outline-none focus:border-[#E63012] font-mono"
                    placeholder="Ex: agv-helmets"
                  />
                </div>

                <div className="flex items-center bg-white/5 border border-gray-800 rounded-xl p-5 shadow-inner">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={!!editingBrand.is_featured}
                    onChange={e => setEditingBrand({ ...editingBrand, is_featured: e.target.checked ? 1 : 0 })}
                    className="mr-4 h-5 w-5 text-[#E63012] bg-black border-gray-700 rounded focus:ring-[#E63012] focus:ring-offset-gray-900 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <label htmlFor="is_featured" className="text-sm font-bold text-white cursor-pointer">Mettre en vedette</label>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Affiche cette marque en priorité</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setEditingBrand(null)}
                    className="px-6 py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#E63012] hover:bg-white hover:text-black text-white px-8 py-3.5 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all inline-flex items-center space-x-2 shadow-[0_0_15px_rgba(230,48,18,0.3)] disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5px]" />}
                    <span>Enregistrer</span>
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

export default AdminBrands;
