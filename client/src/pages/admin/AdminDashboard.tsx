import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Inbox, Users, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../lib/api.ts';
import { formatPrice } from '../../lib/formatters.ts';
import AdminLayout from '../../components/admin/AdminLayout.tsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#111827', '#E63012', '#4B5563', '#9CA3AF', '#D1D5DB'];

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#E63012]" />
        </div>
      </AdminLayout>
    );
  }

  const { kpis, sales_history, sales_by_source, top_products, recent_orders } = dashboardData || {
    kpis: { revenue: 0, pending_orders: 0, active_clients: 0, low_stock_products: 0 },
    sales_history: [],
    sales_by_source: [],
    top_products: [],
    recent_orders: []
  };

  return (
    <AdminLayout>
      <div className="space-y-10">
        
        {/* Page title */}
        <div>
          <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">Tableau de Bord</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">Aperçu général des ventes et de l'inventaire MOTO PACO Maroc.</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue */}
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-2xl hover:border-green-500/50 transition-colors duration-300 group">
            <div className="space-y-2">
              <p className="text-xs font-mono text-gray-400 font-bold uppercase tracking-widest">Chiffre d'affaires</p>
              <h3 className="font-mono text-2xl font-black text-white group-hover:text-green-400 transition-colors">{formatPrice(kpis.revenue)}</h3>
            </div>
            <div className="bg-green-500/10 p-4 rounded-xl text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Pending orders */}
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-2xl hover:border-[#E63012]/50 transition-colors duration-300 group">
            <div className="space-y-2">
              <p className="text-xs font-mono text-gray-400 font-bold uppercase tracking-widest">En attente</p>
              <h3 className="font-mono text-2xl font-black text-white group-hover:text-[#E63012] transition-colors">{kpis.pending_orders}</h3>
            </div>
            <div className="bg-[#E63012]/10 p-4 rounded-xl text-[#E63012] shadow-[0_0_15px_rgba(230,48,18,0.2)]">
              <Inbox className="w-6 h-6" />
            </div>
          </div>

          {/* Clients */}
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-2xl hover:border-blue-500/50 transition-colors duration-300 group">
            <div className="space-y-2">
              <p className="text-xs font-mono text-gray-400 font-bold uppercase tracking-widest">Clients</p>
              <h3 className="font-mono text-2xl font-black text-white group-hover:text-blue-400 transition-colors">{kpis.active_clients}</h3>
            </div>
            <div className="bg-blue-500/10 p-4 rounded-xl text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Low stock */}
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-2xl hover:border-yellow-500/50 transition-colors duration-300 group">
            <div className="space-y-2">
              <p className="text-xs font-mono text-gray-400 font-bold uppercase tracking-widest">Alerte Stock</p>
              <h3 className="font-mono text-2xl font-black text-white group-hover:text-yellow-400 transition-colors">{kpis.low_stock_products}</h3>
            </div>
            <div className="bg-yellow-500/10 p-4 rounded-xl text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Sales Chart */}
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 lg:col-span-2 shadow-2xl">
            <h3 className="font-display font-black text-sm uppercase text-white tracking-widest mb-6">Chiffre d'Affaires 30 Derniers Jours</h3>
            <div className="h-80 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sales_history}>
                  <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#6B7280" tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#6B7280" tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#FFF' }}
                    itemStyle={{ color: '#E63012', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#E63012" strokeWidth={4} dot={{ fill: '#E63012', strokeWidth: 2, r: 4 }} activeDot={{ r: 8, fill: '#FFF', stroke: '#E63012' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Source Chart */}
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 lg:col-span-1 shadow-2xl flex flex-col">
            <h3 className="font-display font-black text-sm uppercase text-white tracking-widest mb-6">Ventes par Source</h3>
            <div className="h-80 w-full text-xs font-mono flex-grow">
              {sales_by_source && sales_by_source.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sales_by_source}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="revenue"
                      nameKey="source"
                      stroke="none"
                    >
                      {sales_by_source.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatPrice(value)}
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#FFF' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 font-medium">Aucune donnée disponible</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Products */}
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-black text-sm uppercase text-white tracking-widest">Meilleures Ventes</h3>
              <button onClick={() => navigate('/admin/products')} className="text-xs font-bold text-[#E63012] hover:text-white transition-colors flex items-center gap-1 uppercase">Voir tout <ArrowRight className="w-3 h-3" /></button>
            </div>
            {top_products.length > 0 ? (
              <div className="space-y-4">
                {top_products.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-[#E63012]/20 text-[#E63012] flex items-center justify-center font-black font-mono text-sm shadow-[0_0_10px_rgba(230,48,18,0.2)]">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-wider">{p.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mt-0.5">{p.sales_count} Ventes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-green-400 font-mono">{formatPrice(p.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune donnée disponible.</p>
            )}
          </div>

          {/* Recent Orders Table */}
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-black text-sm uppercase text-white tracking-widest">Dernières Commandes</h3>
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-xs font-bold text-[#E63012] hover:text-white flex items-center space-x-1 uppercase transition-colors"
              >
                <span>Gérer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 font-mono uppercase tracking-widest text-[10px]">
                    <th className="pb-3">N° Commande</th>
                    <th className="pb-3">Ville</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {recent_orders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 font-mono font-bold text-white">#{ord.order_number}</td>
                      <td className="py-4 text-gray-400 font-medium">{ord.shipping_city}</td>
                      <td className="py-4 font-mono font-black text-[#E63012] group-hover:text-white transition-colors">{formatPrice(ord.total)}</td>
                      <td className="py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          ord.status === 'delivered' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          ord.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {ord.status === 'pending' ? 'En attente' : 
                           ord.status === 'confirmed' ? 'Confirmé' :
                           ord.status === 'shipped' ? 'Expédié' :
                           ord.status === 'delivered' ? 'Livré' : 'Annulé'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recent_orders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500 font-medium">Aucune commande récente.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
