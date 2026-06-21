import React, { useState, useEffect } from 'react';
import { Eye, Edit2, X, AlertCircle, FileSpreadsheet, Loader2, Save } from 'lucide-react';
import api from '../../lib/api.ts';
import { formatDate, formatPrice } from '../../lib/formatters.ts';
import AdminLayout from '../../components/admin/AdminLayout.tsx';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal display states
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Editing status states
  const [statusVal, setStatusVal] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Tab state filter
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/orders');
      setOrders(response.data || []);
      setFilteredOrders(response.data || []);
    } catch (err) {
      console.error('Error fetching admin orders list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter orders by tab selection
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(o => o.status === activeTab));
    }
  }, [activeTab, orders]);

  // Click order line to view details
  const handleOpenDetails = async (order: any) => {
    setSelectedOrder(order);
    setStatusVal(order.status);
    setInternalNotes(order.notes || '');
    setIsModalOpen(true);
    setIsLoadingItems(true);

    try {
      // Fetch details using the secure admin endpoint
      const res = await api.get(`/admin/orders/${order.id}`);
      setSelectedOrderItems(res.data.items || []);
    } catch (err) {
      console.error('Error loading order details items:', err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      await api.put(`/admin/orders/${selectedOrder.id}`, {
        status: statusVal,
        notes: internalNotes
      });
      setIsModalOpen(false);
      loadOrders();
    } catch (err) {
      console.error('Error updating order:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Export orders to CSV file format
  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'N Order,Client,Phone,City,Total,Status,Date\r\n';

    orders.forEach(o => {
      csvContent += `${o.order_number},${o.shipping_first_name} ${o.shipping_last_name},${o.shipping_phone},${o.shipping_city},${o.total},${o.status},${o.created_at}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `commandes_packmoto_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { key: 'all', label: 'Toutes' },
    { key: 'pending', label: 'En attente' },
    { key: 'confirmed', label: 'Confirmées' },
    { key: 'preparing', label: 'En préparation' },
    { key: 'shipped', label: 'Expédiées' },
    { key: 'delivered', label: 'Livrées' },
    { key: 'cancelled', label: 'Annulées' }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Top header */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-20 -mx-8 px-8 pt-4">
          <div>
            <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">Gestion des Commandes</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Suivez, validez et changez les statuts d'expédition des clients.</p>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-[#111827] border border-gray-700 hover:border-green-500 hover:bg-green-500/10 text-white px-6 py-3.5 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all duration-300 inline-flex items-center space-x-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-400" />
            <span>Exporter CSV</span>
          </button>
        </div>

        {/* Filter Tab bar buttons */}
        <div className="flex flex-wrap border-b border-gray-800 gap-2 pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 font-display font-black text-xs uppercase tracking-widest border-b-2 transition-all duration-300 ${
                activeTab === tab.key ? 'border-[#E63012] text-[#E63012] bg-[#E63012]/5 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5 rounded-t-lg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ORDERS TABLE VIEW */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-[#E63012]" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl">
            <AlertCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-lg font-black text-white tracking-wider">Aucune commande trouvée</p>
            <p className="text-sm text-gray-400 mt-2 font-medium">Aucune transaction ne correspond à ce filtre.</p>
          </div>
        ) : (
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-800 bg-black/40 text-gray-400 font-mono uppercase tracking-widest">
                    <th className="p-5">N° Commande</th>
                    <th className="p-5">Client</th>
                    <th className="p-5">Date</th>
                    <th className="p-5 text-right">Montant</th>
                    <th className="p-5">Ville</th>
                    <th className="p-5 text-center">Paiement</th>
                    <th className="p-5 text-center">Statut</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => handleOpenDetails(ord)}>
                      <td className="p-5 font-mono font-bold text-white">#{ord.order_number}</td>
                      <td className="p-5 text-white font-bold">{ord.shipping_first_name} {ord.shipping_last_name}</td>
                      <td className="p-5 text-gray-400">{formatDate(ord.created_at)}</td>
                      <td className="p-5 text-right font-mono font-black text-[#E63012] group-hover:text-white transition-colors">{formatPrice(ord.total)}</td>
                      <td className="p-5 text-gray-400 font-medium">{ord.shipping_city}</td>
                      <td className="p-5 text-center font-mono font-black uppercase tracking-widest text-[10px] text-gray-500">{ord.payment_method}</td>
                      <td className="p-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          ord.status === 'delivered' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          ord.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {ord.status === 'pending' ? 'En attente' : 
                           ord.status === 'confirmed' ? 'Confirmé' :
                           ord.status === 'preparing' ? 'En préparation' :
                           ord.status === 'shipped' ? 'Expédié' :
                           ord.status === 'delivered' ? 'Livré' : 'Annulé'}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenDetails(ord); }}
                          className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-white hover:bg-[#E63012] border border-gray-700 hover:border-[#E63012] rounded-lg transition-all duration-300 inline-flex items-center space-x-2 uppercase text-[10px] font-black tracking-widest shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Détails</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDER DETAILS MODAL OVERLAY */}
        {isModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
            
            <div className="relative bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10 flex flex-col p-8 space-y-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center border-b border-gray-800 pb-6 sticky top-0 bg-[#111827]/95 backdrop-blur-xl z-20">
                <div>
                  <h2 className="font-display font-black text-2xl uppercase tracking-widest text-white flex items-center gap-3">
                    <span className="w-2 h-8 bg-[#E63012] rounded-full inline-block"></span>
                    COMMANDE #{selectedOrder.order_number}
                  </h2>
                  <p className="text-[10px] text-gray-400 font-mono mt-1.5 uppercase tracking-widest">ENREGISTRÉE LE : {formatDate(selectedOrder.created_at)}</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 hover:bg-white/5 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Left col: shipping address & status update */}
                <div className="md:col-span-7 space-y-6">
                  
                  {/* Delivery address details */}
                  <div className="bg-white/5 border border-gray-800 rounded-xl p-6 space-y-4 shadow-inner">
                    <h3 className="text-xs font-mono font-black text-[#E63012] uppercase tracking-widest border-b border-gray-800 pb-3">Client & Expédition</h3>
                    <div className="space-y-3 text-sm">
                      <p className="flex justify-between items-center border-b border-gray-800/50 pb-2">
                        <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Destinataire:</span> 
                        <strong className="text-white text-base">{selectedOrder.shipping_first_name} {selectedOrder.shipping_last_name}</strong>
                      </p>
                      <p className="flex justify-between items-center border-b border-gray-800/50 pb-2">
                        <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Téléphone:</span> 
                        <strong className="text-[#E63012] font-mono text-base">{selectedOrder.shipping_phone}</strong>
                      </p>
                      <p className="flex justify-between items-center border-b border-gray-800/50 pb-2">
                        <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Email:</span> 
                        <span className="text-gray-300">{selectedOrder.shipping_email || 'N/A'}</span>
                      </p>
                      <div className="pt-2">
                        <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Adresse:</span> 
                        <span className="text-gray-300 block bg-black/50 p-3 rounded-lg border border-gray-800">{selectedOrder.shipping_address}, {selectedOrder.shipping_city} {selectedOrder.shipping_zip}</span>
                      </div>
                      {selectedOrder.notes && (
                        <div className="pt-2">
                          <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Notes client:</span> 
                          <span className="text-yellow-400 block bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20 italic">{selectedOrder.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status update controller */}
                  <div className="bg-white/5 border border-gray-800 rounded-xl p-6 space-y-6 shadow-inner">
                    <h3 className="text-xs font-mono font-black text-[#E63012] uppercase tracking-widest border-b border-gray-800 pb-3">Mise à jour Statut</h3>
                    
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sélectionner un statut</label>
                        <select
                          value={statusVal}
                          onChange={(e) => setStatusVal(e.target.value)}
                          className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] cursor-pointer"
                        >
                          <option value="pending">En Attente</option>
                          <option value="confirmed">Confirmée</option>
                          <option value="preparing">En Préparation</option>
                          <option value="shipped">Expédiée</option>
                          <option value="delivered">Livrée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                      </div>

                      <button
                        onClick={handleUpdateOrder}
                        disabled={isUpdating}
                        className="bg-[#E63012] hover:bg-white hover:text-black text-white py-3 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all duration-300 inline-flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(230,48,18,0.3)] disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5px]" />}
                        <span>Appliquer</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes Administrateur (Interne)</label>
                      <textarea
                        rows={3}
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="Ex: Client contacté par téléphone pour confirmer la taille..."
                        className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012]"
                      />
                    </div>
                  </div>

                </div>

                {/* Right col: Invoice lines list */}
                <div className="md:col-span-5 space-y-6">
                  <div className="bg-black/50 border border-gray-800 rounded-xl p-6 shadow-inner h-full flex flex-col">
                    <h3 className="text-xs font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-3 mb-4">Lignes de commande</h3>
                    
                    {isLoadingItems ? (
                      <div className="flex items-center justify-center py-20 flex-grow">
                        <Loader2 className="w-8 h-8 animate-spin text-[#E63012]" />
                      </div>
                    ) : (
                      <div className="space-y-4 divide-y divide-gray-800/50 flex-grow overflow-y-auto pr-2">
                        {selectedOrderItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center pt-4 first:pt-0">
                            <div className="min-w-0 pr-4">
                              <h4 className="text-sm font-bold text-white truncate">{item.product_name}</h4>
                              <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase mt-1">Option: <span className="text-[#E63012]">{item.variant_label}</span> <span className="text-white ml-2">x{item.quantity}</span></p>
                            </div>
                            <span className="font-mono text-sm font-black text-white shrink-0">
                              {formatPrice(item.line_total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Calculations breakdown summary */}
                    <div className="border-t border-gray-800 mt-6 pt-6 text-sm space-y-3 font-mono">
                      <div className="flex justify-between text-gray-400">
                        <span>Sous-total</span>
                        <span className="text-white">{formatPrice(selectedOrder.subtotal)}</span>
                      </div>
                      {selectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>Remise</span>
                          <span>-{formatPrice(selectedOrder.discount_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-400">
                        <span>Livraison <span className="text-[10px] uppercase tracking-widest ml-1">({selectedOrder.delivery_method})</span></span>
                        <span className="text-white">{selectedOrder.shipping_cost === 0 ? 'Gratuit' : formatPrice(selectedOrder.shipping_cost)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-800 mt-4 pt-4 text-base font-black text-white">
                        <span className="text-[#E63012]">TOTAL</span>
                        <span className="text-[#E63012] text-xl">{formatPrice(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
