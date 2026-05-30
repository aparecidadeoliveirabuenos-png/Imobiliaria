import React, { useState, DragEvent } from 'react';
import { RealEstateDeal, DealStatus } from '../types';
import DealCard from './DealCard';
import { Landmark, Activity, FolderCheck, Plus, Sparkles } from 'lucide-react';

interface KanbanBoardProps {
  deals: RealEstateDeal[];
  onEdit: (deal: RealEstateDeal) => void;
  onDelete: (id: string) => void;
  onMoveStatus: (id: string, newStatus: DealStatus) => void;
  onAddNewAtStatus: (status: DealStatus) => void;
}

export default function KanbanBoard({
  deals,
  onEdit,
  onDelete,
  onMoveStatus,
  onAddNewAtStatus,
}: KanbanBoardProps) {
  // Columns definition
  const columns: { status: DealStatus; title: string; color: string; icon: any; bg: string; text: string }[] = [
    {
      status: 'Não iniciado',
      title: 'Não Iniciado',
      color: 'border-slate-300 bg-slate-100',
      icon: Landmark,
      bg: 'bg-slate-100',
      text: 'text-slate-700',
    },
    {
      status: 'Em Andamento',
      title: 'Em Andamento',
      color: 'border-amber-200 bg-amber-50',
      icon: Activity,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
    },
    {
      status: 'Finalizado',
      title: 'Finalizado',
      color: 'border-[#A7F3D0] bg-[#ECFDF5]',
      icon: FolderCheck,
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
    },
  ];

  // Track dragging over columns to add visual borders
  const [activeDragColumn, setActiveDragColumn] = useState<string | null>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>, status: DealStatus) => {
    e.preventDefault();
    setActiveDragColumn(status);
  };

  const handleDragLeave = () => {
    setActiveDragColumn(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetStatus: DealStatus) => {
    e.preventDefault();
    setActiveDragColumn(null);
    const dealId = e.dataTransfer.getData('text/plain');
    if (dealId) {
      onMoveStatus(dealId, targetStatus);
    }
  };

  // Safe currency calculation
  const getColumnTotalValue = (statusDeals: RealEstateDeal[]) => {
    const sum = statusDeals.reduce((acc, deal) => acc + (deal.property_value || 0), 0);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(sum);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {columns.map((column) => {
        const columnDeals = deals.filter((deal) => deal.status === column.status);
        const IconComponent = column.icon;
        const isDraggingOver = activeDragColumn === column.status;

        return (
          <div
            key={column.status}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
            className={`flex flex-col rounded-2xl border p-4 transition-all duration-300 min-h-[600px] ${
              isDraggingOver 
                ? 'border-slate-800 bg-slate-200/80 shadow-md scale-[1.01]' 
                : 'border-[#E2E8F0] bg-slate-200/30'
            }`}
          >
            {/* Header of Column */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${column.bg} ${column.text}`}>
                  <IconComponent className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wide">
                    {column.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {columnDeals.length} {columnDeals.length === 1 ? 'itg' : 'itgs'}
                    </span>
                    <span className="text-slate-300 text-[10px]">•</span>
                    <span className="text-[10px] font-extrabold text-[#0F172A] font-mono">
                      {getColumnTotalValue(columnDeals)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Add Deal within status */}
              <button
                onClick={() => onAddNewAtStatus(column.status)}
                className="p-1 px-2.5 bg-white border border-slate-200 hover:border-slate-800 rounded-md text-slate-700 hover:text-slate-900 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5"
                title={`Adicionar negócio direto em "${column.status}"`}
              >
                <Plus className="w-3 h-3 text-[#0F172A]" />
                <span>Criar</span>
              </button>
            </div>

            {/* List of cards */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[70vh] pr-1">
              {columnDeals.length > 0 ? (
                columnDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onMoveStatus={onMoveStatus}
                  />
                ))
              ) : (
                /* Beautiful empty state styled for light mode */
                <div 
                  onClick={() => onAddNewAtStatus(column.status)}
                  className="flex-1 min-h-[150px] border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50/50 rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group"
                >
                  <Plus className="w-6 h-6 text-slate-400 group-hover:text-slate-800 group-hover:scale-110 transition-all mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide group-hover:text-slate-800 transition-colors">
                    Nenhum negócio aqui
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] font-medium leading-relaxed">
                    Arraste um card ou clique para cadastrar manualmente.
                  </p>
                </div>
              )}
            </div>
            
          </div>
        );
      })}
    </div>
  );
}
