import React, { useState, useEffect, FormEvent } from 'react';
import { X, Save, ShieldAlert, Phone, Mail, User, Landmark, Coins, Briefcase } from 'lucide-react';
import { RealEstateDeal, DealStatus } from '../types';

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: Omit<RealEstateDeal, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
  dealToEdit?: RealEstateDeal | null;
  initialStatus?: DealStatus;
}

export default function DealModal({
  isOpen,
  onClose,
  onSave,
  dealToEdit,
  initialStatus,
}: DealModalProps) {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [propertyType, setPropertyType] = useState('Apartamento');
  const [propertyValue, setPropertyValue] = useState('');
  const [dealType, setDealType] = useState<'Venda' | 'Aluguel'>('Venda');
  const [status, setStatus] = useState<DealStatus>('Não iniciado');
  const [priority, setPriority] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [brokerName, setBrokerName] = useState('');
  const [description, setDescription] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (dealToEdit) {
        setTitle(dealToEdit.title);
        setClientName(dealToEdit.client_name);
        setClientPhone(dealToEdit.client_phone || '');
        setClientEmail(dealToEdit.client_email || '');
        setPropertyType(dealToEdit.property_type);
        setPropertyValue(dealToEdit.property_value ? String(dealToEdit.property_value) : '');
        setDealType(dealToEdit.deal_type);
        setStatus(dealToEdit.status);
        setPriority(dealToEdit.priority);
        setBrokerName(dealToEdit.broker_name || '');
        setDescription(dealToEdit.description || '');
      } else {
        // Create mode
        setTitle('');
        setClientName('');
        setClientPhone('');
        setClientEmail('');
        setPropertyType('Apartamento');
        setPropertyValue('');
        setDealType('Venda');
        setStatus(initialStatus || 'Não iniciado');
        setPriority('Média');
        setBrokerName('');
        setDescription('');
      }
      setFormError(null);
    }
  }, [isOpen, dealToEdit, initialStatus]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('O título do negócio é obrigatório.');
      return;
    }
    if (!clientName.trim()) {
      setFormError('O nome do cliente interessado é obrigatório.');
      return;
    }
    if (!propertyType.trim()) {
      setFormError('O tipo do imóvel é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: dealToEdit?.id,
        title: title.trim(),
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || undefined,
        client_email: clientEmail.trim() || undefined,
        property_type: propertyType.trim(),
        property_value: propertyValue ? Number(propertyValue) : undefined,
        deal_type: dealType,
        status: status,
        priority: priority,
        broker_name: brokerName.trim() || undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao salvar negócio. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const propertyTypesList = ['Apartamento', 'Casa', 'Cobertura', 'Terreno', 'Comercial', 'Sobrado', 'Chácara', 'Flat', 'Outro'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="deal-modal">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0F172A]/85 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] text-left shadow-2xl transition-all w-full max-w-2xl">
          
          {/* Header */}
          <div className="bg-white px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-base font-extrabold font-sans text-[#0F172A] uppercase tracking-tight">
              {dealToEdit ? 'Editar Negócio Imobiliário' : 'Novo Negócio Imobiliário'}
            </h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-800 rounded-lg p-1 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-start gap-2 font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-650" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title & value row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                    Título do Negócio / Imóvel *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Landmark className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Apartamento 3 quartos Botafogo"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                    Valor Pretendido (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Coins className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      placeholder="Ex: 450000"
                      value={propertyValue}
                      onChange={(e) => setPropertyValue(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A]"
                    />
                  </div>
                </div>
              </div>

              {/* Client Name & Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                    Interessado (Cliente) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Nome do cliente"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                    Telefone Cliente
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      placeholder="(21) 99999-9999"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                    E-mail Cliente
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="cliente@email.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A]"
                    />
                  </div>
                </div>
              </div>

              {/* Property Type, Deal type & priority */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                    Tipo de Imóvel
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-xs text-[#0F172A] font-bold focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] cursor-pointer"
                  >
                    {propertyTypesList.map(type => (
                      <option key={type} value={type} className="bg-white text-[#0F172A]">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                    Modalidade de Negócio
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDealType('Venda')}
                      className={`py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wide border text-center cursor-pointer transition-all ${
                        dealType === 'Venda'
                          ? 'bg-[#0F172A] border-[#0F172A] text-white'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-500 hover:text-[#0F172A] hover:bg-slate-100'
                      }`}
                    >
                      Venda
                    </button>
                    <button
                      type="button"
                      onClick={() => setDealType('Aluguel')}
                      className={`py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wide border text-center cursor-pointer transition-all ${
                        dealType === 'Aluguel'
                          ? 'bg-[#0F172A] border-[#0F172A] text-white'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-500 hover:text-[#0F172A] hover:bg-slate-100'
                      }`}
                    >
                      Aluguel
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                    Prioridade
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Baixa', 'Média', 'Alta'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border text-center cursor-pointer transition-all ${
                          priority === p
                            ? p === 'Baixa'
                              ? 'bg-blue-50 border-blue-300 text-blue-700'
                              : p === 'Média'
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'bg-rose-50 border-rose-300 text-rose-700'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-400 hover:text-[#0F172A] hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status and Responsible Broker */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                    Status Atual no Funil
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DealStatus)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-xs text-[#0F172A] font-bold focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] cursor-pointer"
                  >
                    <option value="Não iniciado" className="bg-white text-[#0F172A]">Não Iniciado</option>
                    <option value="Em Andamento" className="bg-white text-[#0F172A]">Em Andamento</option>
                    <option value="Finalizado" className="bg-white text-[#0F172A]">Finalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                    Corretor Responsável
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Nome do corretor, ex: Silas Santos"
                      value={brokerName}
                      onChange={(e) => setBrokerName(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A]"
                    />
                  </div>
                </div>
              </div>

              {/* Description field */}
              <div>
                <label className="block text-[10px] font-black text-[#0F172A] tracking-wider uppercase mb-1">
                  Observações e Histórico do Negócio
                </label>
                <textarea
                  rows={3}
                  placeholder="Informações adicionais, histórico de visitas, exigências do cliente..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 p-2.5 text-xs text-[#0F172A] font-semibold placeholder-slate-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] resize-none"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-5 border-t border-[#E2E8F0] flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0F172A] hover:bg-slate-800 text-white px-6 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                {isSubmitting ? 'Salvando...' : 'Salvar Negócio'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
