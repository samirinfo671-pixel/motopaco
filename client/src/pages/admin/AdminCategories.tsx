import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Loader2, Image as ImageIcon, Trash2, X, Save, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import AdminLayout from '../../components/admin/AdminLayout';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const { accessToken } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsLoading(true);
    try {
      const isNew = !editingCategory.id;
      const url = isNew ? '/api/admin/categories' : `/api/admin/categories/${editingCategory.id}`;
      const method = isNew ? 'POST' : 'PUT';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(editingCategory)
      });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingCategory) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setEditingCategory({ ...editingCategory, image_url: data.url });
      }
    } catch (error) {
      console.error('Failed to upload image', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette catégorie ? Les produits associés ne seront plus catégorisés.')) return;
    try {
      await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category', error);
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-20 -mx-8 px-8 pt-4">
          <div>
            <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">Catégories</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Gérez la structure du catalogue MotoPaco.</p>
          </div>
          <button
            onClick={() => setEditingCategory({ name: '', slug: '', image_url: '', is_featured: 0 })}
            className="bg-[#E63012] hover:bg-white hover:text-black text-white px-6 py-3.5 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all duration-300 inline-flex items-center space-x-2 shadow-[0_0_15px_rgba(230,48,18,0.3)]"
          >
            <Plus className="w-4 h-4 stroke-[2.5px]" />
            <span>Ajouter Catégorie</span>
          </button>
        </div>

        <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-800 bg-black/40 text-gray-400 font-mono uppercase tracking-widest">
                <th className="p-5 w-20">Visuel</th>
                <th className="p-5">Nom</th>
                <th className="p-5">Slug</th>
                <th className="p-5 text-center">En Vedette</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-5">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} referrerPolicy="no-referrer" className="h-12 w-12 object-cover rounded-lg border border-gray-700 group-hover:border-[#E63012] transition-colors" />
                    ) : (
                      <div className="h-12 w-12 bg-black/50 border border-gray-700 rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                  </td>
                  <td className="p-5 text-white font-bold text-sm">{cat.name}</td>
                  <td className="p-5 text-gray-400 font-mono">{cat.slug}</td>
                  <td className="p-5 text-center">
                    {cat.is_featured ? (
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
                        onClick={() => setEditingCategory(cat)} 
                        className="p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-[#E63012] border border-gray-700 hover:border-[#E63012] rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)} 
                        className="p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-500 border border-gray-700 hover:border-red-500 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500 font-medium">
                    Aucune catégorie n'est configurée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {editingCategory && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center border-b border-gray-800 pb-5 mb-6">
                <h2 className="font-display font-black text-xl uppercase tracking-widest text-white flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-[#E63012] rounded-full inline-block"></span>
                  {editingCategory.id ? 'Modifier Catégorie' : 'Nouvelle Catégorie'}
                </h2>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 hover:bg-white/5 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom de la catégorie</label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] font-bold"
                    placeholder="Ex: Casques Intégraux"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Slug (URL)</label>
                  <input
                    type="text"
                    value={editingCategory.slug}
                    onChange={e => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-400 w-full focus:outline-none focus:border-[#E63012] font-mono"
                    placeholder="Ex: casques-integraux"
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Image de la Catégorie</label>
                  <div className="flex items-center gap-6 bg-white/5 border border-gray-800 rounded-xl p-4 shadow-inner">
                    {editingCategory.image_url ? (
                      <img src={editingCategory.image_url} alt="Aperçu" referrerPolicy="no-referrer" className="w-20 h-20 object-cover rounded-lg border border-gray-700 shadow-md" />
                    ) : (
                      <div className="w-20 h-20 bg-black border border-gray-700 border-dashed rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all w-full mb-2"
                      >
                        Changer l'image
                      </button>
                      <p className="text-[10px] text-gray-500 font-medium text-center">Format carré recommandé (JPG, PNG)</p>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                </div>

                <div className="flex items-center bg-white/5 border border-gray-800 rounded-xl p-5 shadow-inner">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={!!editingCategory.is_featured}
                    onChange={e => setEditingCategory({ ...editingCategory, is_featured: e.target.checked ? 1 : 0 })}
                    className="mr-4 h-5 w-5 text-[#E63012] bg-black border-gray-700 rounded focus:ring-[#E63012] focus:ring-offset-gray-900 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <label htmlFor="is_featured" className="text-sm font-bold text-white cursor-pointer">Mettre en vedette</label>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Affiche cette catégorie sur la page d'accueil</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
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
