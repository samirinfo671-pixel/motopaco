import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut, Package, Mail, Phone, Lock, Eye, EyeOff, Loader2, Info } from 'lucide-react';
import { useAuthStore } from '../store/auth.ts';
import api from '../lib/api.ts';
import { formatDate, formatPrice } from '../lib/formatters.ts';
import SEOHead from '../components/seo/SEOHead.tsx';

export const Compte: React.FC = () => {
  const navigate = useNavigate();
  const { user, setAuth, logout } = useAuthStore();

  // Login/Register Switch
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch orders history when logged in
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setIsLoadingHistory(true);
      try {
        const res = await api.get('/orders/customer/history');
        setOrdersHistory(res.data || []);
      } catch (err) {
        console.error('Error fetching order history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [user]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Veuillez remplir tous les champs.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      const { accessToken, refreshToken, user: userData } = res.data;
      setAuth(accessToken, refreshToken, userData);
      
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Identifiants invalides.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password || !firstName.trim() || !lastName.trim() || !phone.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const phoneRegex = /^(?:\+212|0)[67]\d{8}$/;
    if (!phoneRegex.test(phone.trim().replace(/\s+/g, ''))) {
      setErrorMsg('Numéro de téléphone invalide. Utilisez un format marocain (ex: 0612345678).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/register', {
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim().replace(/\s+/g, '')
      });
      const { accessToken, refreshToken, user: userData } = res.data;
      setAuth(accessToken, refreshToken, userData);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de la création du compte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-28 pb-16 text-[#111827]">
      <SEOHead
        title="Mon Compte | MOTO PACO"
        description="Connectez-vous à votre espace client MOTO PACO pour suivre vos commandes en cours et consulter votre historique d'achats."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* LOGGED OUT STATE */}
        {!user ? (
          <div className="max-w-md mx-auto bg-[#FFFFFF] border border-[#E5E7EB] rounded overflow-hidden shadow-2xl mt-8">
            <div className="flex border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg('');
                }}
                className={`flex-1 py-4 font-display font-bold text-xs uppercase tracking-wider border-b-2 text-center transition-all ${
                  activeTab === 'login' ? 'border-[#E63012] text-white' : 'border-transparent text-[#4B5563] hover:text-white'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg('');
                }}
                className={`flex-1 py-4 font-display font-bold text-xs uppercase tracking-wider border-b-2 text-center transition-all ${
                  activeTab === 'register' ? 'border-[#E63012] text-white' : 'border-transparent text-[#4B5563] hover:text-white'
                }`}
              >
                Créer un compte
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded text-xs font-bold flex items-center space-x-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {activeTab === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#4B5563] uppercase">Adresse email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-[#4B5563]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded pl-10 pr-4 py-3 text-sm text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#4B5563] uppercase">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-[#4B5563]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded pl-10 pr-10 py-3 text-sm text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-[#4B5563] hover:text-[#E63012] focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#E63012] hover:bg-[#111827] text-white py-3.5 rounded font-display text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5 shadow red-glow"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>SE CONNECTER</span>}
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#4B5563] uppercase">Prénom</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded px-3 py-3 text-sm text-[#111827] w-full focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#4B5563] uppercase">Nom</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded px-3 py-3 text-sm text-[#111827] w-full focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#4B5563] uppercase">Numéro Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-4 h-4 text-[#4B5563]" />
                      <input
                        type="tel"
                        required
                        placeholder="Ex: 0612345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded pl-10 pr-4 py-3 text-sm text-[#111827] w-full focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#4B5563] uppercase">Adresse email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-[#4B5563]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded pl-10 pr-4 py-3 text-sm text-[#111827] w-full focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#4B5563] uppercase">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-[#4B5563]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded pl-10 pr-4 py-3 text-sm text-[#111827] w-full focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#E63012] hover:bg-[#111827] text-white py-3.5 rounded font-display text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5 shadow red-glow"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>CRÉER MON COMPTE</span>}
                  </button>
                </form>
              )}

            </div>
          </div>
        ) : (
          /* LOGGED IN CUSTOMER DASHBOARD */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column: profile summary */}
            <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 h-fit space-y-6">
              
              <div className="flex items-center space-x-4">
                <div className="bg-[#E63012] text-white p-4 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display font-black text-xl text-[#111827] uppercase tracking-wide truncate">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-xs font-mono text-[#4B5563] tracking-wider uppercase mt-0.5">{user.role}</p>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] pt-6 space-y-4 text-xs sm:text-sm">
                <div className="flex items-center space-x-3 text-[#4B5563]">
                  <Mail className="w-4 h-4 text-[#E63012] shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-[#4B5563]">
                  <Phone className="w-4 h-4 text-[#E63012] shrink-0" />
                  <span>{user.phone}</span>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] pt-6">
                <button
                  onClick={handleLogout}
                  className="w-full bg-[#E5E7EB] hover:bg-red-600 hover:text-white text-[#4B5563] py-3.5 rounded font-display text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se Déconnecter</span>
                </button>
              </div>

            </div>

            {/* Right Column: Order History */}
            <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 sm:p-8 space-y-6">
              <h3 className="font-display font-black italic text-lg uppercase tracking-wide text-[#111827] border-b border-[#E5E7EB] pb-3 flex items-center space-x-2">
                <Package className="w-5 h-5 text-[#E63012]" />
                <span>Mon Historique de Commandes</span>
              </h3>

              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-7 h-7 animate-spin text-[#E63012]" />
                </div>
              ) : ordersHistory.length === 0 ? (
                <div className="text-center py-16 text-[#4B5563] space-y-3">
                  <Package className="w-12 h-12 text-[#E5E7EB] mx-auto" />
                  <p className="text-sm font-bold text-[#111827]">Aucune commande passée</p>
                  <p className="text-xs max-w-xs mx-auto leading-relaxed">Vos commandes s'afficheront ici dès que vous aurez validé vos premiers achats.</p>
                  <button
                    onClick={() => navigate('/boutique')}
                    className="inline-block mt-4 bg-[#E63012] text-white text-xs font-bold tracking-wider uppercase px-5 py-2.5 rounded font-display hover:bg-[#111827] transition-colors"
                  >
                    Faire des achats
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[#4B5563] font-mono uppercase tracking-wider">
                        <th className="pb-3 pr-2">N° Commande</th>
                        <th className="pb-3 pr-2">Date</th>
                        <th className="pb-3 pr-2">Total</th>
                        <th className="pb-3 pr-2">Statut</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]/40">
                      {ordersHistory.map((order) => (
                        <tr key={order.id} className="hover:bg-[#E5E7EB]/20 transition-colors">
                          <td className="py-4 pr-2 font-mono font-bold text-white">{order.order_number}</td>
                          <td className="py-4 pr-2 text-[#4B5563]">{formatDate(order.created_at)}</td>
                          <td className="py-4 pr-2 font-mono font-bold text-[#E63012]">{formatPrice(order.total)}</td>
                          <td className="py-4 pr-2">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              order.status === 'delivered' ? 'bg-green-500/10 text-green-400' :
                              order.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                              'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {order.status === 'pending' ? 'En Attente' :
                               order.status === 'confirmed' ? 'Confirmée' :
                               order.status === 'preparing' ? 'En Préparation' :
                               order.status === 'shipped' ? 'Expédiée' :
                               order.status === 'delivered' ? 'Livrée' : 'Annulée'}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => navigate(`/confirmation?orderNumber=${order.order_number}&phone=${encodeURIComponent(order.shipping_phone)}`)}
                              className="text-xs font-bold text-[#E63012] hover:underline uppercase"
                            >
                              Suivre
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Compte;
