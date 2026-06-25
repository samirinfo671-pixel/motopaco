import React, { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, Play, CheckCircle, AlertCircle, Terminal, Eye, EyeOff, Loader2, Globe, ShieldAlert, Key, Activity } from 'lucide-react';
import api from '../../lib/api.ts';
import AdminLayout from '../../components/admin/AdminLayout.tsx';

interface SyncState {
  status: 'idle' | 'syncing' | 'success' | 'failed';
  currentStep: string;
  progress: number;
  logs: string[];
  lastSyncAt: string | null;
  error: string | null;
}

export const AdminWordPressImport: React.FC = () => {
  // Settings Form State
  const [wooUrl, setWooUrl] = useState('');
  const [wooCk, setWooCk] = useState('');
  const [wooCs, setWooCs] = useState('');
  
  const [showCk, setShowCk] = useState(false);
  const [showCs, setShowCs] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync State
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    currentStep: 'Prêt à synchroniser',
    progress: 0,
    logs: [],
    lastSyncAt: null,
    error: null
  });

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch credentials and initial status on mount
  useEffect(() => {
    fetchCredentials();
    fetchSyncStatus();
  }, []);

  // Poll status while syncing
  useEffect(() => {
    let interval: any = null;
    
    if (syncState.status === 'syncing') {
      interval = setInterval(() => {
        fetchSyncStatus();
      }, 1500);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncState.status]);

  // Scroll terminal logs to bottom when they change
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [syncState.logs]);

  const fetchCredentials = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setWooUrl(res.data.woocommerce_url || '');
        setWooCk(res.data.woocommerce_ck || '');
        setWooCs(res.data.woocommerce_cs || '');
      }
    } catch (error) {
      console.error('Failed to fetch WordPress settings:', error);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const res = await api.get('/admin/woocommerce-import/status');
      if (res.data) {
        setSyncState(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/admin/settings', {
        woocommerce_url: wooUrl.trim(),
        woocommerce_ck: wooCk.trim(),
        woocommerce_cs: wooCs.trim()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save WooCommerce settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartSync = async () => {
    if (!wooUrl || !wooCk || !wooCs) {
      alert("Veuillez d'abord configurer et enregistrer vos identifiants WooCommerce.");
      return;
    }
    
    try {
      setSyncState(prev => ({
        ...prev,
        status: 'syncing',
        currentStep: 'Initialisation...',
        progress: 0,
        logs: ['[Infos] Lancement de la demande de synchronisation...']
      }));
      
      await api.post('/admin/woocommerce-import/sync');
      
      // Instantly call fetch to update logs/status
      setTimeout(() => fetchSyncStatus(), 500);
    } catch (error: any) {
      console.error('Failed to start sync:', error);
      alert(error.response?.data?.message || "Impossible de démarrer la synchronisation.");
      fetchSyncStatus();
    }
  };

  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Sticky Title Bar */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-20 -mx-8 px-8 pt-4">
          <div>
            <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white flex items-center gap-3">
              Importer WordPress / WooCommerce
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              Synchronisez vos catégories, marques, produits et variations depuis votre site WordPress WooCommerce.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* LEFT: API Credentials Panel */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
              <h2 className="font-display font-black text-lg uppercase tracking-widest text-white pb-4 border-b border-gray-800 flex items-center gap-2.5">
                <span className="w-1.5 h-6 bg-[#E63012] rounded-full inline-block"></span>
                Configuration API
              </h2>
              
              <form onSubmit={handleSaveCredentials} className="space-y-5" autoComplete="off">
                {/* Woo URL */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#E63012]" /> URL du Site WordPress
                  </label>
                  <input
                    type="url"
                    required
                    value={wooUrl}
                    onChange={(e) => setWooUrl(e.target.value)}
                    placeholder="https://votre-boutique-wordpress.com"
                    autoComplete="off"
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-mono text-sm"
                  />
                </div>

                {/* Woo CK */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#E63012]" /> Consumer Key (CK)
                  </label>
                  <div className="relative">
                    <input
                      type={showCk ? "text" : "password"}
                      required
                      value={wooCk}
                      onChange={(e) => setWooCk(e.target.value)}
                      placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      autoComplete="new-password"
                      className="w-full bg-black border border-gray-700 rounded-lg pl-4 pr-10 py-3 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCk(!showCk)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showCk ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Woo CS */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#E63012]" /> Consumer Secret (CS)
                  </label>
                  <div className="relative">
                    <input
                      type={showCs ? "text" : "password"}
                      required
                      value={wooCs}
                      onChange={(e) => setWooCs(e.target.value)}
                      placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      autoComplete="new-password"
                      className="w-full bg-black border border-gray-700 rounded-lg pl-4 pr-10 py-3 focus:ring-0 focus:outline-none focus:border-[#E63012] text-white font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCs(!showCs)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showCs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 bg-[#E63012] hover:bg-white hover:text-black text-white py-3.5 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(230,48,18,0.2)] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Enregistré !</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 stroke-[2.5px]" />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Note Panel */}
            <div className="bg-[#111827]/40 border border-gray-800/80 rounded-2xl p-5 text-xs text-gray-400 space-y-3 leading-relaxed">
              <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[10px]">
                <ShieldAlert className="w-4 h-4 text-[#E63012]" /> Notes Importantes
              </div>
              <p>
                1. Assurez-vous que les clés d'API WooCommerce ont au moins des droits de <strong>Lecture (Read)</strong>.
              </p>
              <p>
                2. Les produits existants sont identifiés par leur slug. Si un produit existe déjà, ses prix, descriptions et stock seront mis à jour sans dupliquer l'article.
              </p>
              <p>
                3. Les variations de taille et couleur sont synchronisées à l'aide des attributs de produit standard de WooCommerce (Taille / Size et Couleur / Color).
              </p>
            </div>
          </div>

          {/* RIGHT: Importer Tool Dashboard */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-4 border-b border-gray-800">
                <h2 className="font-display font-black text-lg uppercase tracking-widest text-white flex items-center gap-2.5">
                  <span className="w-1.5 h-6 bg-[#E63012] rounded-full inline-block"></span>
                  Console de Synchronisation
                </h2>
                
                {/* Connection Status indicator */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Statut :</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    syncState.status === 'syncing' 
                      ? 'bg-blue-900/40 text-blue-400 border border-blue-800/50' 
                      : syncState.status === 'success'
                      ? 'bg-green-900/40 text-green-400 border border-green-800/50'
                      : syncState.status === 'failed'
                      ? 'bg-red-900/40 text-red-400 border border-red-800/50'
                      : 'bg-gray-800 text-gray-400 border border-gray-700/50'
                  }`}>
                    {syncState.status === 'syncing' && <Loader2 className="w-3 h-3 animate-spin" />}
                    {syncState.status === 'success' && <CheckCircle className="w-3 h-3" />}
                    {syncState.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                    {syncState.status === 'idle' && <Activity className="w-3 h-3" />}
                    {syncState.status === 'syncing' ? 'En cours' : syncState.status === 'success' ? 'Succès' : syncState.status === 'failed' ? 'Échoué' : 'Inactif'}
                  </span>
                </div>
              </div>

              {/* Sync controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 border border-gray-800/60 rounded-xl p-5">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dernier Import</p>
                  <p className="text-white font-mono text-sm mt-1">{formatLastSync(syncState.lastSyncAt)}</p>
                </div>
                
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleStartSync}
                    disabled={syncState.status === 'syncing'}
                    className="flex items-center gap-2.5 bg-[#E63012] hover:bg-white hover:text-black text-white px-6 py-3 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(230,48,18,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group w-full sm:w-auto justify-center"
                  >
                    {syncState.status === 'syncing' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Synchronisation en cours...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                        <span>Lancer la Synchronisation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white uppercase tracking-wider text-[10px]">{syncState.currentStep}</span>
                  <span className="font-mono text-gray-400 font-bold">{syncState.progress}%</span>
                </div>
                
                {/* Progress Bar Container */}
                <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800 relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#E63012] to-red-500 rounded-full transition-all duration-500 shadow-[0_0_10px_#E63012]"
                    style={{ width: `${syncState.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Logs Console Window */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[#E63012]" /> Logs en temps réel
                </label>
                
                <div className="w-full bg-black border border-gray-800 rounded-xl p-5 h-72 overflow-y-auto font-mono text-[11px] text-green-500 space-y-1.5 custom-scrollbar animate-fadeIn">
                  {syncState.logs.length === 0 ? (
                    <p className="text-gray-500 italic">En attente de synchronisation...</p>
                  ) : (
                    syncState.logs.map((log, index) => {
                      let colorClass = 'text-green-400';
                      if (log.includes('ERREUR') || log.includes('Erreur') || log.includes('❌')) {
                        colorClass = 'text-red-500 font-bold';
                      } else if (log.includes('⚠️')) {
                        colorClass = 'text-yellow-400';
                      } else if (log.includes('🏁') || log.includes('🎉') || log.includes('Success') || log.includes('reçue')) {
                        colorClass = 'text-white font-bold';
                      } else if (log.includes('[Infos]') || log.includes('Début')) {
                        colorClass = 'text-blue-400';
                      }

                      return (
                        <div key={index} className={`break-words ${colorClass}`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminWordPressImport;
