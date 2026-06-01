import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, X, Send, Bot, User, 
  Sparkles, RefreshCw, Trash2, ArrowRight 
} from 'lucide-react';
import { RealEstateDeal } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface HelpAgentProps {
  deals: RealEstateDeal[];
}

export default function HelpAgent({ deals }: HelpAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('crm_help_chat');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading chat history:', e);
    }
    return [
      {
        role: 'assistant',
        content: 'Olá! Sou o **Agente de Ajuda AI** do seu CRM Imobiliário. Tenho acesso completo a todos os dados cadastrais, valores de pipeline, informações dos corretores e status das propostas.\n\nComo posso ajudar você a analisar e gerir os negócios hoje? Clique em um dos tópicos abaixo ou faça uma pergunta direta!',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Save conversation history
  useEffect(() => {
    try {
      localStorage.setItem('crm_help_chat', JSON.stringify(messages));
    } catch (e) {
      console.error('Error saving chat history:', e);
    }
  }, [messages]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

  // Suggested quick prompts
  const suggestions = [
    { label: '📊 Resumo Geral', prompt: 'Me dê um resumo geral do pipeline de vendas, com o total de negócios e soma de valores.' },
    { label: '🔥 Prioridades Altas', prompt: 'Quais são os negócios de prioridade Alta atualmente no funil?' },
    { label: '💼 Corretores Atrib.', prompt: 'Como está a distribuição de propostas e valores por corretor?' },
    { label: '🔑 Aluguéis e Ativos', prompt: 'Quais imóveis estão em modalidade de Aluguel e quais são os valores?' }
  ];

  // Send message function
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setErrorStatus(null);

    try {
      // Prepare messages payload (including last few messages to maintain conversation context)
      // Send to server-side dynamic proxy endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Send last 6 messages to keep reasoning chain lightweight but coherent
          messages: [...messages, userMessage].slice(-7).map(m => ({
            role: m.role,
            content: m.content
          })),
          deals: deals // send freshest state from current rendering screen
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Servidor respondeu com erro ${response.status}`);
      }

      const responseJson = await response.json();
      const assistantReply = responseJson.choices?.[0]?.message?.content || 'Desculpe, não consegui obter uma resposta.';

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Error calling CRM Help Agent:', err);
      setErrorStatus(err.message || 'Erro de comunicação. Verifique a chave Groq.');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: '⚠️ **Erro na conexão:** Não foi possível contactar o serviço do Groq.\n\nPor favor, garanta que a chave de API **GROQ_API_KEY** foi adicionada nos segredos ou enviada corretamente nas variáveis de ambiente da plataforma, e recarregue a página.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Tem certeza que deseja apagar o histórico de conversas do assistente?')) {
      const initialMessage: Message = {
        role: 'assistant',
        content: 'Histórico redefinido. Olá! Sou o **Agente de Ajuda AI** do seu CRM Imobiliário. Como posso lhe ajudar agora?',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([initialMessage]);
    }
  };

  // Safe markdown text formatter
  const renderFormattedText = (text: string) => {
    return text.split('\n\n').map((paragraph, pIdx) => {
      const trimmed = paragraph.trim();
      
      // Headers (e.g. ### Title)
      if (trimmed.startsWith('###')) {
        const titleText = trimmed.replace(/^###\s*/, '');
        return (
          <h5 key={pIdx} className="text-xs font-black uppercase text-[#0F172A] tracking-wider mt-3 mb-1.5">
            {renderInlineMarkdown(titleText)}
          </h5>
        );
      }
      if (trimmed.startsWith('##') || trimmed.startsWith('#')) {
        const titleText = trimmed.replace(/^##?\s*/, '');
        return (
          <h4 key={pIdx} className="text-sm font-black text-[#0F172A] tracking-tight mt-3.5 mb-2 border-b border-slate-100 pb-0.5 uppercase">
            {renderInlineMarkdown(titleText)}
          </h4>
        );
      }

      // Bullets (e.g. - item or * item)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const lines = trimmed.split('\n').filter(line => line.trim().length > 0);
        return (
          <ul key={pIdx} className="list-disc list-outside pl-4 my-2.5 space-y-1.5 text-xs text-slate-700 font-medium">
            {lines.map((line, lIdx) => {
              const cleanLine = line.trim().replace(/^[-*]\s+/, '');
              return (
                <li key={lIdx} className="leading-relaxed">
                  {renderInlineMarkdown(cleanLine)}
                </li>
              );
            })}
          </ul>
        );
      }

      // Numbers list (e.g. 1. item)
      if (/^\d+\.\s+/.test(trimmed)) {
        const lines = trimmed.split('\n').filter(line => line.trim().length > 0);
        return (
          <ol key={pIdx} className="list-decimal list-outside pl-4 my-2.5 space-y-1.5 text-xs text-slate-700 font-medium">
            {lines.map((line, lIdx) => {
              const cleanLine = line.trim().replace(/^\d+\.\s+/, '');
              return (
                <li key={lIdx} className="leading-relaxed">
                  {renderInlineMarkdown(cleanLine)}
                </li>
              );
            })}
          </ol>
        );
      }

      // Default paragraph
      return (
        <p key={pIdx} className="text-xs leading-relaxed text-slate-700 font-medium mb-2.5">
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Escape **bolding**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-extrabold text-[#0F172A]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#0F172A] hover:bg-slate-800 text-white rounded-full p-4 shadow-xl hover:shadow-2xl border border-slate-700/50 flex items-center justify-center cursor-pointer transition-colors relative"
          title="Agente de Ajuda AI"
          id="help-agent-trigger"
        >
          {isOpen ? (
            <X className="w-6 h-6 animate-fade-in" />
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-xs font-extrabold tracking-wider uppercase pr-1">Agente AI</span>
            </div>
          )}
        </motion.button>
      </div>

      {/* Slide-out Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-6 w-full max-w-[420px] h-[550px] bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl z-50 overflow-hidden flex flex-col"
            id="help-agent-chat-window"
          >
            {/* Header */}
            <div className="bg-[#0F172A] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 relative">
                  <Bot className="w-5 h-5" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-[#0F172A]" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">Suporte Imobiliário AI</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest leading-none">Consultor Ativo</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Limpar Histórico de Conversa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fechar Assistente"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Window */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 min-h-0">
              {messages.map((message, index) => {
                const isBot = message.role === 'assistant';
                return (
                  <div key={index} className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
                    {isBot && (
                      <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-emerald-400 flex items-center justify-center shrink-0 border border-slate-800 select-none">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex flex-col max-w-[80%]">
                      <div className={`p-3.5 rounded-2xl text-[12px] border ${
                        isBot 
                          ? 'bg-white border-[#E2E8F0] rounded-tl-none shadow-xs text-slate-800' 
                          : 'bg-[#0F172A] border-[#0F172A] text-white rounded-tr-none shadow-sm'
                      }`}>
                        {renderFormattedText(message.content)}
                      </div>
                      <span className={`text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-1 px-1.5 ${isBot ? 'text-left' : 'text-right'}`}>
                        {message.timestamp}
                      </span>
                    </div>
                    {!isBot && (
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0F172A] flex items-center justify-center shrink-0 border border-emerald-200 select-none">
                        <User className="w-4 h-4 text-[#0F172A]" />
                      </div>
                    )}
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-emerald-400 flex items-center justify-center border border-slate-800 select-none">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#0F172A] animate-spin" />
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                        Cruzando dados...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions / Actions */}
            <div className="px-3.5 py-2.5 bg-white border-t border-b border-[#E2E8F0] overflow-x-auto whitespace-nowrap flex gap-2 shrink-0 select-none scrollbar-none">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.prompt)}
                  disabled={isLoading}
                  className="inline-flex items-center bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 hover:text-[#0F172A] cursor-pointer transition-all disabled:opacity-50"
                >
                  {s.label}
                  <ArrowRight className="w-3 h-3 ml-1 opacity-60" />
                </button>
              ))}
            </div>

            {/* Message input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="p-3 bg-white flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder={isLoading ? 'Aguardando agente...' : 'Pergunte sobre clientes, valores ou pipeline...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#0F172A] font-medium placeholder-slate-400 focus:outline-none focus:border-[#0F172A] disabled:opacity-55 transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-100 text-white disabled:text-slate-400 p-3 rounded-xl cursor-pointer transition-all disabled:cursor-not-allowed border border-[#0F172A] disabled:border-slate-100 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
