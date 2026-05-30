import React from 'react';
import { Database, Wifi, WifiOff, LayoutDashboard, Landmark, Users, Clock, Settings, RefreshCw } from 'lucide-react';

interface SidebarProps {
  isUsingSupabase: boolean;
  onOpenConfig: () => void;
  onSync: () => void;
  syncLoading: boolean;
  hasLocalDeals: boolean;
}

export default function Sidebar({
  isUsingSupabase,
  onOpenConfig,
  onSync,
  syncLoading,
  hasLocalDeals,
}: SidebarProps) {
  return (
    <aside className="w-full md:w-64 bg-[#0F172A] text-white px-6 py-8 flex flex-col justify-between shrink-0 border-b md:border-b-0 md:border-r border-[#1E293B] font-sans">
      <div>
        {/* Brand/Logo branding with heavy Bold Typography */}
        <div className="mb-8 select-none">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500 text-slate-950 p-1 rounded-md text-xs font-bold font-mono">
              CRM
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter leading-none text-white font-display">
            IMO<br />CRM.
          </h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-2">
            Kanban Imobiliário
          </p>
        </div>

        {/* Navigation Items mimicking the professional design template */}
        <nav className="space-y-1">
          <div className="flex items-center gap-3 py-3 px-3 text-sm font-bold text-white bg-slate-800/60 rounded-xl cursor-default">
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            <span>Painel Kanban</span>
          </div>
          
          <div 
            onClick={onOpenConfig}
            className="flex items-center gap-3 py-3 px-3 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/40 rounded-xl cursor-pointer transition-colors"
          >
            <Landmark className="w-4 h-4" />
            <span>Configuração SQL</span>
          </div>

          <div className="flex items-center gap-3 py-3 px-3 text-sm font-semibold text-slate-500 hover:text-slate-400 rounded-xl cursor-not-allowed select-none transition-colors group relative">
            <Users className="w-4 h-4" />
            <span>Contatos de Clientes</span>
            <span className="absolute right-3 text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">BREVE</span>
          </div>

          <div className="flex items-center gap-3 py-3 px-3 text-sm font-semibold text-slate-500 hover:text-slate-400 rounded-xl cursor-not-allowed select-none transition-colors group relative">
            <Clock className="w-4 h-4" />
            <span>Histórico de Visitas</span>
            <span className="absolute right-3 text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">BREVE</span>
          </div>
        </nav>
      </div>

      {/* Connection & Sincronization Bottom Status */}
      <div className="mt-8 pt-6 border-t border-[#1E293B] space-y-4">
        {/* Supabase status layout with premium dots and configuration buttons */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${isUsingSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className={isUsingSupabase ? 'text-emerald-400' : 'text-amber-400'}>
              {isUsingSupabase ? 'SUPABASE CONNECTED' : 'MODO LOCAL ACTIVE'}
            </span>
          </div>
        </div>

        {/* Local storage sync prompt */}
        {hasLocalDeals && isUsingSupabase && (
          <button
            onClick={onSync}
            disabled={syncLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white py-2 px-3 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer text-center"
            title="Sincronizar tarefas locais para o banco remoto no Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
            <span>Sincronizar Local</span>
          </button>
        )}

        <button
          onClick={onOpenConfig}
          className="w-full text-center text-[11px] text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-700 py-1.5 rounded-lg cursor-pointer font-medium"
        >
          Editar Conexão SQL
        </button>
      </div>
    </aside>
  );
}
