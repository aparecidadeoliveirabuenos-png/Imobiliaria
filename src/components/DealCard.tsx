import React, { DragEvent } from 'react';
import { RealEstateDeal, DealStatus } from '../types';
import { 
  Phone, Mail, User, Landmark, Tag, Pencil, Trash2, 
  ArrowLeft, ArrowRight, UserCheck, Calendar 
} from 'lucide-react';

interface DealCardProps {
  key?: string | number;
  deal: RealEstateDeal;
  onEdit: (deal: RealEstateDeal) => void;
  onDelete: (id: string) => void;
  onMoveStatus: (id: string, newStatus: DealStatus) => void;
}

export default function DealCard({
  deal,
  onEdit,
  onDelete,
  onMoveStatus,
}: DealCardProps) {
  
  // Format currency
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Convert status back/forth for arrows
  const getPrevStatus = (current: DealStatus): DealStatus | null => {
    if (current === 'Em Andamento') return 'Não iniciado';
    if (current === 'Finalizado') return 'Em Andamento';
    return null;
  };

  const getNextStatus = (current: DealStatus): DealStatus | null => {
    if (current === 'Não iniciado') return 'Em Andamento';
    if (current === 'Em Andamento') return 'Finalizado';
    return null;
  };

  const prevStatus = getPrevStatus(deal.status);
  const nextStatus = getNextStatus(deal.status);

  // Drag handles
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', deal.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add nice style during drag
    const cardElement = e.currentTarget as HTMLElement;
    cardElement.style.opacity = '0.4';
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    const cardElement = e.currentTarget as HTMLElement;
    cardElement.style.opacity = '1';
  };


  // Human date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  // Priority color tags
  const priorityColors = {
    Alta: 'bg-rose-50 text-rose-700 border border-rose-200',
    Média: 'bg-amber-50 text-amber-700 border border-amber-200',
    Baixa: 'bg-sky-50 text-sky-700 border border-sky-200',
  };

  return (
    <div
      id={`deal-card-${deal.id}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="bg-white border border-[#E2E8F0] rounded-xl p-4.5 shadow-xs hover:shadow-md hover:border-[#0F172A] transition-all cursor-grab active:cursor-grabbing group select-none relative"
    >
      {/* Header tags */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
          deal.deal_type === 'Venda' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          {deal.deal_type}
        </span>

        <div className="flex items-center gap-1.5">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${priorityColors[deal.priority]}`}>
            {deal.priority}
          </span>
          <span className="text-[10px] font-mono text-slate-400 font-extrabold flex items-center gap-0.5 uppercase tracking-wide">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formatDate(deal.created_at)}
          </span>
        </div>
      </div>

      {/* Title & Value */}
      <div className="mb-3">
        <h4 className="text-sm font-extrabold text-[#0F172A] group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
          {deal.title}
        </h4>
        {deal.property_value !== undefined && (
          <p className="text-xs font-black text-emerald-600 mt-1 font-mono tracking-tight">
            {formatCurrency(deal.property_value)}
            {deal.deal_type === 'Aluguel' && <span className="text-[10px] text-slate-400 font-bold"> /MÊS</span>}
          </p>
        )}
      </div>

      <div className="border-t border-[#E2E8F0] my-2.5" />

      {/* Specs / Client / Details */}
      <div className="space-y-1.5 text-xs text-slate-500 mb-3.5">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-[9px] text-slate-400">
          <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{deal.property_type}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-700 font-extrabold truncate uppercase tracking-tight text-[11px]" title="Cliente">
            {deal.client_name}
          </span>
        </div>

        {deal.client_phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <a 
              href={`tel:${deal.client_phone}`} 
              className="hover:text-emerald-700 transition-colors font-mono font-bold tracking-tight text-slate-600"
            >
              {deal.client_phone}
            </a>
          </div>
        )}

        {deal.client_email && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate text-slate-600 font-bold text-[11px]" title={deal.client_email}>{deal.client_email}</span>
          </div>
        )}

        {deal.broker_name && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E2E8F0] text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Corretor: <strong className="text-slate-700 font-black">{deal.broker_name}</strong></span>
          </div>
        )}

        {deal.description && (
          <p className="text-[11px] text-slate-500 italic line-clamp-2 mt-2 border-l-2 border-slate-300 pl-2 leading-relaxed font-semibold">
            "{deal.description}"
          </p>
        )}
      </div>

      <div className="border-t border-[#E2E8F0] mt-3 mb-2.5" />

      {/* Card Actions & Move Arrows */}
      <div className="flex items-center justify-between gap-1">
        {/* Left move arrow */}
        <div>
          {prevStatus ? (
            <button
              onClick={() => onMoveStatus(deal.id, prevStatus)}
              className="p-1.5 rounded bg-slate-50 hover:bg-slate-200 border border-[#E2E8F0] text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-xs active:scale-95"
              title={`Mover para "${prevStatus}"`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="w-7 h-7" /> // Spacer
          )}
        </div>

        {/* Edit and Delete */}
        <div className="flex items-center gap-1.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(deal)}
            className="p-1.5 rounded bg-slate-50 hover:bg-slate-250 border border-[#E2E8F0] text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
            title="Editar negócio"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Tem certeza que deseja excluir este negócio do CRM?')) {
                onDelete(deal.id);
              }
            }}
            className="p-1.5 rounded bg-slate-50 hover:bg-rose-50 border border-[#E2E8F0] text-slate-600 hover:text-rose-600 transition-all cursor-pointer shadow-xs"
            title="Excluir negócio"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right move arrow */}
        <div>
          {nextStatus ? (
            <button
              onClick={() => onMoveStatus(deal.id, nextStatus)}
              className="p-1.5 rounded bg-slate-50 hover:bg-slate-200 border border-[#E2E8F0] text-slate-600 hover:text-[#0F172A] transition-all cursor-pointer shadow-xs active:scale-95"
              title={`Mover para "${nextStatus}"`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="w-7 h-7" /> // Spacer
          )}
        </div>
      </div>
    </div>
  );
}
