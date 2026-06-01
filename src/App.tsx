import { useState, useMemo, useEffect } from 'react';
import { useDeals } from './hooks/useDeals';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import DealModal from './components/DealModal';
import HelpAgent from './components/HelpAgent';
import { RealEstateDeal, DealStatus } from './types';
import { 
  Building, Search, Filter, ShieldAlert, Coins, 
  HelpCircle, RefreshCw, Layers, CheckCircle2, TrendingUp, Sparkles, X 
} from 'lucide-react';

export default function App() {
  const {
    deals,
    loading,
    error,
    isUsingSupabase,
    loadDeals,
    saveDeal,
    updateDealStatus,
    deleteDeal,
    syncLocalToSupabase
  } = useDeals();

  // Modal display states
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isDealOpen, setIsDealOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<RealEstateDeal | null>(null);
  const [initialStatus, setInitialStatus] = useState<DealStatus>('Não iniciado');

  // Sync operations states
  const [syncLoading, setSyncLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('Todos');
  const [dealTypeFilter, setDealTypeFilter] = useState('Todos');
  const [priorityFilter, setPriorityFilter] = useState('Todos');

  // Check if has local deals to sync
  const [hasLocalDeals, setHasLocalDeals] = useState(false);

  const checkLocalDeals = () => {
    try {
      const stored = localStorage.getItem('crm_deals');
      if (stored) {
        const parsed = JSON.parse(stored);
        setHasLocalDeals(parsed && parsed.length > 0);
      } else {
        setHasLocalDeals(false);
      }
    } catch {
      setHasLocalDeals(false);
    }
  };

  useEffect(() => {
    checkLocalDeals();
  }, [deals]);

  // Handle Syncing to Supabase
  const handleSyncDeals = async () => {
    setSyncLoading(true);
    setToast(null);
    try {
      const result = await syncLocalToSupabase();
      if (result.successCount > 0) {
        setToast({
          message: `Sincronização completa! ${result.successCount} negócio(s) foram migrados para o seu Supabase.`,
          type: 'success'
        });
      } else if (result.errorCount > 0) {
        setToast({
          message: 'Houve um erro ao tentar sincronizar alguns negócios. Verifique as credenciais e conexões do Supabase.',
          type: 'error'
        });
      }
      checkLocalDeals();
    } catch (err: any) {
      setToast({
        message: `Falha na sincronização: ${err.message || 'Erro desconhecido'}`,
        type: 'error'
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // Helper close toast
  const closeToast = () => setToast(null);

  // Quick modals triggers
  const handleOpenNewDeal = (status?: DealStatus) => {
    setDealToEdit(null);
    setInitialStatus(status || 'Não iniciado');
    setIsDealOpen(true);
  };

  const handleOpenEditDeal = (deal: RealEstateDeal) => {
    setDealToEdit(deal);
    setIsDealOpen(true);
  };

  // Apply search/filters
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = 
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deal.broker_name && deal.broker_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesProperty = propertyTypeFilter === 'Todos' || deal.property_type === propertyTypeFilter;
      const matchesDealType = dealTypeFilter === 'Todos' || deal.deal_type === dealTypeFilter;
      const matchesPriority = priorityFilter === 'Todos' || deal.priority === priorityFilter;

      return matchesSearch && matchesProperty && matchesDealType && matchesPriority;
    });
  }, [deals, searchTerm, propertyTypeFilter, dealTypeFilter, priorityFilter]);

  // Pipelines value metrics
  const metrics = useMemo(() => {
    const totalPipeline = deals.reduce((acc, d) => acc + (d.property_value || 0), 0);
    const inProgress = deals
      .filter(d => d.status === 'Em Andamento')
      .reduce((acc, d) => acc + (d.property_value || 0), 0);
    const finalized = deals
      .filter(d => d.status === 'Finalizado')
      .reduce((acc, d) => acc + (d.property_value || 0), 0);

    const activeDealsCount = deals.length;
    const closedCount = deals.filter(d => d.status === 'Finalizado').length;

    return {
      totalPipeline,
      inProgress,
      finalized,
      activeDealsCount,
      closedCount
    };
  }, [deals]);

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const propertyTypes = ['Apartamento', 'Casa', 'Cobertura', 'Terreno', 'Comercial', 'Sobrado', 'Chácara', 'Flat', 'Outro'];

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex flex-col md:flex-row font-sans selection:bg-[#0F172A] selection:text-white">
      
      {/* Sidebar Navigation */}
      <Sidebar
        isUsingSupabase={isUsingSupabase}
        onOpenConfig={() => setIsConfigOpen(true)}
        onSync={handleSyncDeals}
        syncLoading={syncLoading}
        hasLocalDeals={hasLocalDeals}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Design Header */}
        <header className="h-24 bg-white border-b border-[#E2E8F0] px-6 sm:px-8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-[#0F172A] uppercase font-display">
              Gestão de Vendas
            </h2>
            <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-0.5 hidden sm:block">
              Funil de Negócios / CRM Imobiliário
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenNewDeal('Não iniciado')}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-5 py-2.5 rounded-lg text-xs font-extrabold tracking-wider uppercase cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              + Adicionar Negócio
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 p-6 sm:p-8 space-y-6">

          {/* Informative Alerts Toasts */}
          {toast && (
            <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-fade-in ${
              toast.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`w-5 h-5 shrink-0 ${toast.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
                <p className="text-sm font-bold tracking-tight">{toast.message}</p>
              </div>
              <button 
                onClick={closeToast}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Database setup notification overlay if offline and zero deals */}
          {!isUsingSupabase && deals.length === 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-1.5 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  Conexão Supabase Disponível
                </div>
                <h2 className="text-xl font-extrabold font-display text-[#0F172A] tracking-tight">
                  Pronto para armazenar seus dados em nuvem
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                  Crie e gerencie negócios localmente agora mesmo. Quando estiver pronto para salvar na nuvem e preparar para o deploy no GitHub/Vercel, clique em <strong>Configurar Banco de Dados</strong> para conectar instantaneamente.
                </p>
              </div>
              <button
                onClick={() => setIsConfigOpen(true)}
                className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 shrink-0"
              >
                Configurar Banco Supabase
              </button>
            </div>
          )}

          {/* Metrics Section styled with refined high-contrast look */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-extrabold">
                  Pipeline Total
                </p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] font-mono tracking-tighter mt-1">
                  {formatBRL(metrics.totalPipeline)}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wide">
                  {metrics.activeDealsCount} {metrics.activeDealsCount === 1 ? 'Oportunidade' : 'Oportunidades'}
                </p>
              </div>
              <span className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hidden sm:inline">
                <Coins className="w-5 h-5" />
              </span>
            </div>

            <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-extrabold">
                  Em Negociação
                </p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-amber-600 font-mono tracking-tighter mt-1">
                  {formatBRL(metrics.inProgress)}
                </h3>
                <p className="text-[10px] font-bold text-amber-700 mt-0.5 uppercase tracking-wide">
                  Propostas em análise
                </p>
              </div>
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hidden sm:inline">
                <Layers className="w-5 h-5" />
              </span>
            </div>

            <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-extrabold">
                  Fechados / Finalizados
                </p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#10B981] font-mono tracking-tighter mt-1">
                  {formatBRL(metrics.finalized)}
                </h3>
                <p className="text-[10px] font-bold text-[#10B981] mt-0.5 uppercase tracking-wide">
                  Ganhos acumulados
                </p>
              </div>
              <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hidden sm:inline">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>

            <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl flex items-center justify-between col-span-2 lg:col-span-1 shadow-sm">
              <div>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-extrabold">
                  Status da Conexão
                </p>
                <h3 className="text-xs font-extrabold tracking-wide uppercase mt-1">
                  {isUsingSupabase ? (
                    <span className="text-emerald-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Banco Supabase Ativo
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Armazenamento Local
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal max-w-[200px] uppercase font-bold tracking-tight">
                  {isUsingSupabase 
                    ? 'Dados salvos em nuvem e pronto p/ Vercel.' 
                    : 'Guardado localmente. Sem risco de perda de estado.'}
                </p>
              </div>
            </div>

          </section>

          {/* Searching and Filters Bar */}
          <section className="bg-white border border-[#E2E8F0] p-5 rounded-2xl space-y-3 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Search Input */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por imóvel, interessado ou corretor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] pr-4 pl-10 py-2.5 text-xs text-[#0F172A] font-medium placeholder-slate-400 rounded-lg focus:outline-none focus:border-[#0F172A] transition-colors"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Filters Group */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Filter By Property Type */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">Imóvel:</span>
                  <select
                    value={propertyTypeFilter}
                    onChange={(e) => setPropertyTypeFilter(e.target.value)}
                    className="bg-white border border-[#E2E8F0] text-[#0F172A] font-bold text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-[#0F172A] cursor-pointer"
                  >
                    <option value="Todos">Todos</option>
                    {propertyTypes.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>

                {/* Filter By Deal Type */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">Negócio:</span>
                  <select
                    value={dealTypeFilter}
                    onChange={(e) => setDealTypeFilter(e.target.value)}
                    className="bg-white border border-[#E2E8F0] text-[#0F172A] font-bold text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-[#0F172A] cursor-pointer"
                  >
                    <option value="Todos">Venda & Aluguel</option>
                    <option value="Venda">Venda</option>
                    <option value="Aluguel">Aluguel</option>
                  </select>
                </div>

                {/* Filter By Priority */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">Prioridade:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-white border border-[#E2E8F0] text-[#0F172A] font-bold text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-[#0F172A] cursor-pointer"
                  >
                    <option value="Todos">Todas</option>
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>

                {/* Reset Filters button */}
                {(searchTerm || propertyTypeFilter !== 'Todos' || dealTypeFilter !== 'Todos' || priorityFilter !== 'Todos') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPropertyTypeFilter('Todos');
                      setDealTypeFilter('Todos');
                      setPriorityFilter('Todos');
                    }}
                    className="text-xs text-slate-500 hover:text-[#0F172A] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                )}

              </div>
            </div>
          </section>

          {/* Loading and Error handlers */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <RefreshCw className="w-10 h-10 text-[#0F172A] animate-spin" />
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Carregando CRM Kanban...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-2xl text-xs space-y-3 shadow-sm">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 select-none" />
                <div>
                  <p className="font-extrabold uppercase tracking-wide text-sm">Erro de Comunicação</p>
                  <p className="opacity-95 font-medium mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={() => loadDeals()}
                className="bg-[#0F172A] hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider cursor-pointer text-xs"
              >
                Tentar Recarregar
              </button>
            </div>
          ) : (
            /* Kanban Board layout */
            <KanbanBoard
              deals={filteredDeals}
              onEdit={handleOpenEditDeal}
              onDelete={deleteDeal}
              onMoveStatus={updateDealStatus}
              onAddNewAtStatus={handleOpenNewDeal}
            />
          )}

        </div>

        {/* Footer info footnote from the custom layout */}
        <footer className="bg-white border-t border-[#E2E8F0] py-6 px-8 mt-12 text-slate-400 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-bold uppercase tracking-wider text-[10px]">
            <p>© 2026 IMO CRM. SISTEMA CORPORATIVO DE HIGH-PERFORMANCE.</p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsConfigOpen(true)} 
                className="hover:text-[#0F172A] cursor-pointer"
              >
                Configurar Supabase
              </button>
            </div>
          </div>
        </footer>

      </main>

      {/* Connection Config MODAL */}
      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConnectionChanged={loadDeals}
      />

      {/* Creation & Editing MODAL */}
      <DealModal
        isOpen={isDealOpen}
        onClose={() => setIsDealOpen(false)}
        onSave={saveDeal}
        dealToEdit={dealToEdit}
        initialStatus={initialStatus}
      />

      {/* AI Help Agent floating panel */}
      <HelpAgent deals={deals} />

    </div>
  );
}
