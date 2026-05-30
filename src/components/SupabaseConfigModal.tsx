import { useState, useEffect } from 'react';
import { X, Copy, Check, Info, Server, HelpCircle, Save } from 'lucide-react';
import { getSavedConfig, saveConfig, SUPABASE_SQL_SCRIPT, getSupabaseClient } from '../supabaseClient';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged: () => void;
}

export default function SupabaseConfigModal({
  isOpen,
  onClose,
  onConnectionChanged,
}: SupabaseConfigModalProps) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getSavedConfig();
      if (config) {
        setUrl(config.url);
        setKey(config.anonKey);
      } else {
        setUrl('');
        setKey('');
      }
      setTestState('idle');
      setTestError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveConfig(url, key);
    onConnectionChanged();
    // Test instantly
    handleTestConnection();
  };

  const handleTestConnection = async () => {
    setTestState('testing');
    setTestError(null);

    // Save temporarily first
    saveConfig(url, key);

    const client = getSupabaseClient();
    if (!client) {
      setTestState('error');
      setTestError('Formato de URL ou Chave inválido. Por favor, verifique se a URL começa com http/https.');
      return;
    }

    try {
      // Direct query test to table
      const { data, error } = await client.from('deals').select('*').limit(1);
      
      if (error) {
        // If table doesn't exist yet, but client connected successfully, that's a partial success!
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          setTestState('error');
          setTestError('Conectado à API do Supabase com Sucesso, mas a tabela "deals" não foi encontrada. Você executou o Script SQL no seu banco?');
        } else {
          setTestState('error');
          setTestError(error.message);
        }
      } else {
        setTestState('success');
        onConnectionChanged();
      }
    } catch (err: any) {
      setTestState('error');
      setTestError(err.message || 'Falha de rede ao tentar conectar.');
    }
  };

  const handleClear = () => {
    setUrl('');
    setKey('');
    saveConfig('', '');
    onConnectionChanged();
    setTestState('idle');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="supabase-config-modal">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0F172A]/85 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] text-left shadow-2xl transition-all w-full max-w-3xl flex flex-col md:flex-row">
          
          {/* Main Config Area */}
          <div className="flex-1 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-[#0F172A]" />
                <h3 className="text-lg font-extrabold font-sans text-[#0F172A] uppercase tracking-tight">
                  Conexão Supabase
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-800 rounded-lg p-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-6 leading-relaxed font-semibold">
              Integre o seu painel Kanban diretamente com o banco de dados do Supabase. Dessa forma, as tarefas/propostas que você cadastrar serão salvas na nuvem com segurança.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                  URL do Projeto Supabase
                </label>
                <input
                  type="text"
                  placeholder="https://xxxxxxxxx.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-xs text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:border-[#0F172A] font-mono transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                  Chave Pública Anon (Key)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-xs text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:border-[#0F172A] font-mono transition-colors"
                />
              </div>
            </div>

            {/* Test Status Indicator */}
            {testState !== 'idle' && (
              <div className={`mt-4 p-4 rounded-xl text-xs leading-relaxed border ${
                testState === 'testing' ? 'bg-[#F8FAFC] text-slate-600 border-[#E2E8F0]' :
                testState === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' :
                'bg-rose-50 text-rose-800 border-rose-250'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {testState === 'testing' && <RefreshCw className="w-4 h-4 animate-spin text-[#0F172A]" />}
                  {testState === 'success' && <Check className="w-4 h-4 text-emerald-600 font-extrabold" />}
                  {testState === 'error' && <Info className="w-4 h-4 text-rose-600" />}
                  <span className="font-extrabold uppercase tracking-wider text-[10px]">
                    {testState === 'testing' && 'Testando conexão...'}
                    {testState === 'success' && 'Conectado com Sucesso!'}
                    {testState === 'error' && 'Problema na Conexão'}
                  </span>
                </div>
                {testError && <p className="text-[11px] font-mono mt-1 opacity-90 font-bold">{testError}</p>}
                {testState === 'success' && (
                  <p className="text-[11px] mt-1 opacity-95 font-medium">
                    Seu CRM está sincronizado! Os negócios e status serão atualizados diretamente no banco de dados.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg py-3 text-xs font-extrabold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar e Testar
              </button>
              
              { (url || key) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="bg-slate-100 hover:bg-slate-200 text-[#0F172A] border border-[#E2E8F0] rounded-lg px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* SQL / Instructions Panel */}
          <div className="bg-[#0F172A] text-white md:w-80 border-t md:border-t-0 md:border-l border-slate-800 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-semibold font-sans text-white">
                  Como Preparar o Supabase?
                </h4>
              </div>

              <ol className="text-xs text-slate-400 space-y-3 list-decimal list-inside leading-relaxed mb-6">
                <li>Acesse o painel do seu <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300">Supabase</a> e crie um projeto gratuito.</li>
                <li>Vá em <strong>SQL Editor</strong> e clique em <strong>New Query</strong>.</li>
                <li>Copie o script SQL gerado abaixo, cole no editor e clique em <strong>Run</strong>.</li>
                <li>Vá nas configurações da engrenagem → <strong>API</strong> para pegar a <strong>Project URL</strong> e <strong>anon public key</strong>. Cole-as aqui à esquerda!</li>
              </ol>
            </div>

            <div className="border border-slate-800 bg-slate-900 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Tabela deals (SQL)</span>
                <button
                  onClick={handleCopySQL}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-400 cursor-pointer h-7 px-2 rounded hover:bg-slate-800"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copiar SQL
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[9px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto max-h-24 select-all">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helper icons inside code
const RefreshCw = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
