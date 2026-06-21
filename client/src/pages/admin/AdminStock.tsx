import React, { useState, useEffect } from 'react';
import { Layers, Save, Check, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../lib/api.ts';
import AdminLayout from '../../components/admin/AdminLayout.tsx';

export const AdminStock: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [flatVariants, setFlatVariants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tracks inline editing states: { [variantId]: stockNum }
  const [editingStocks, setEditingStocks] = useState<{ [id: number]: number }>({});
  // Tracks successful save feedbacks: { [variantId]: boolean }
  const [savedFeedbacks, setSavedFeedbacks] = useState<{ [id: number]: boolean }>({});
  // Tracks individual variant save loader states: { [variantId]: boolean }
  const [savingLoaders, setSavingLoaders] = useState<{ [id: number]: boolean }>({});

  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/products');
      const prods = response.data || [];
      setProducts(prods);

      // Flatten products into an array of variants
      const flat: any[] = [];
      prods.forEach((p: any) => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v: any) => {
            flat.push({
              ...v,
              product_name: p.name,
              primary_image: p.primary_image
            });
          });
        }
      });
      setFlatVariants(flat);
    } catch (err) {
      console.error('Error fetching admin stock data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockChange = (variantId: number, val: string) => {
    const parsed = parseInt(val, 10);
    setEditingStocks(prev => ({
      ...prev,
      [variantId]: isNaN(parsed) ? 0 : parsed
    }));
  };

  const handleSaveStockInline = async (variantId: number, currentVal: number) => {
    const stockToSave = editingStocks[variantId] !== undefined ? editingStocks[variantId] : currentVal;

    setSavingLoaders(prev => ({ ...prev, [variantId]: true }));
    try {
      await api.put(`/admin/variants/${variantId}/stock`, { stock: stockToSave });
      
      // Flash save checkmark feedback
      setSavedFeedbacks(prev => ({ ...prev, [variantId]: true }));
      setTimeout(() => {
        setSavedFeedbacks(prev => ({ ...prev, [variantId]: false }));
      }, 2000);

      // Reload list to sync all metrics
      loadVariants();
    } catch (err) {
      console.error('Error saving inline variant stock:', err);
    } finally {
      setSavingLoaders(prev => ({ ...prev, [variantId]: false }));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Title */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-20 -mx-8 px-8 pt-4">
          <div>
            <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">Gestion du Stock</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Suivi et mise à jour immédiate des variantes et des alertes de rupture.</p>
          </div>
        </div>

        {/* ALERTS SUMMARY */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 flex items-center space-x-4 text-yellow-400 text-xs font-black font-mono uppercase tracking-widest shadow-inner">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <span>
            Les lignes en surbrillance rouge indiquent un stock inférieur ou égal au seuil critique (3 pièces).
          </span>
        </div>

        {/* VARIANTS STOCK TABLE */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-[#E63012]" />
          </div>
        ) : (
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-800 bg-black/40 text-gray-400 font-mono uppercase tracking-widest">
                    <th className="p-5 w-20">Visuel</th>
                    <th className="p-5">Nom Produit</th>
                    <th className="p-5">Variante (Option)</th>
                    <th className="p-5">SKU</th>
                    <th className="p-5 text-center w-48">Modifier Stock</th>
                    <th className="p-5 text-center">Statut Seuil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {flatVariants.map((v) => {
                    const isLow = v.stock <= v.low_stock_threshold;
                    const isEditing = editingStocks[v.id] !== undefined;
                    const stockValue = isEditing ? editingStocks[v.id] : v.stock;

                    return (
                      <tr
                        key={v.id}
                        className={`transition-colors group ${
                          isLow ? 'bg-red-500/10 hover:bg-red-500/20' : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="p-5">
                          <img
                            src={v.primary_image}
                            alt={v.product_name}
                            className="w-12 h-12 object-cover rounded-lg bg-black border border-gray-700 group-hover:border-gray-500 transition-colors"
                          />
                        </td>
                        <td className="p-5 font-bold text-white max-w-[240px] truncate text-sm">
                          {v.product_name}
                        </td>
                        <td className="p-5 text-gray-400 font-black tracking-widest uppercase">
                          {v.size || 'Unique'} {v.color ? `| ${v.color}` : ''}
                        </td>
                        <td className="p-5 font-mono text-xs text-gray-500 font-bold">{v.sku}</td>
                        
                        {/* Inline Stock Edit cells */}
                        <td className="p-5 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              value={stockValue}
                              onChange={(e) => handleStockChange(v.id, e.target.value)}
                              className="w-20 bg-black border border-gray-700 rounded-lg text-center px-3 py-2 font-mono font-black text-white focus:outline-none focus:border-[#E63012] transition-colors"
                            />
                            <button
                              onClick={() => handleSaveStockInline(v.id, v.stock)}
                              disabled={savingLoaders[v.id]}
                              className="p-2.5 bg-gray-800 border border-gray-700 hover:border-[#E63012] hover:bg-[#E63012] hover:text-white text-gray-400 rounded-lg transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
                              aria-label="Enregistrer le stock"
                            >
                              {savingLoaders[v.id] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : savedFeedbacks[v.id] ? (
                                <Check className="w-4 h-4 text-white stroke-[3px]" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="p-5 text-center">
                          {isLow ? (
                            <span className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                              ⚡ Seuil Critique
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 bg-green-500/20 border border-green-500/40 text-green-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                              Conforme
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {flatVariants.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-gray-500 font-medium">
                        Aucune variante trouvée pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminStock;
