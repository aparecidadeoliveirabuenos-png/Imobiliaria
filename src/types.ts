export type DealStatus = 'Não iniciado' | 'Em Andamento' | 'Finalizado';

export interface RealEstateDeal {
  id: string;
  created_at: string;
  title: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  property_type: string; // e.g. "Apartamento", "Casa", "Terreno", "Cobertura", "Comercial"
  property_value?: number;
  deal_type: 'Venda' | 'Aluguel';
  description?: string;
  status: DealStatus;
  priority: 'Baixa' | 'Média' | 'Alta';
  broker_name?: string; // Corretor responsável
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
