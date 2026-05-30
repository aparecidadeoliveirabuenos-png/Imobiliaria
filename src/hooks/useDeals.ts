import { useState, useEffect, useCallback } from 'react';
import { RealEstateDeal, DealStatus } from '../types';
import { getSupabaseClient } from '../supabaseClient';

export function useDeals() {
  const [deals, setDeals] = useState<RealEstateDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  // Check connection state
  const checkConnection = useCallback(() => {
    const client = getSupabaseClient();
    setIsUsingSupabase(!!client);
    return client;
  }, []);

  // Fetch or load deals
  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    const client = checkConnection();

    if (client) {
      try {
        const { data, error: sbError } = await client
          .from('deals')
          .select('*')
          .order('created_at', { ascending: false });

        if (sbError) {
          throw sbError;
        }

        setDeals((data || []) as RealEstateDeal[]);
        setIsUsingSupabase(true);
      } catch (err: any) {
        console.error('Erro ao buscar do Supabase, utilizando modo offline:', err);
        setError(`Erro Supabase: ${err.message || 'Erro deconhecido'}. Exibindo dados locais.`);
        loadLocalDeals();
      } finally {
        setLoading(false);
      }
    } else {
      loadLocalDeals();
      setLoading(false);
    }
  }, [checkConnection]);

  // Load from local storage
  const loadLocalDeals = () => {
    try {
      const stored = localStorage.getItem('crm_deals');
      if (stored) {
        setDeals(JSON.parse(stored));
      } else {
        setDeals([]);
      }
      setIsUsingSupabase(false);
    } catch (e) {
      console.error('Erro ao ler do localStorage:', e);
      setDeals([]);
    }
  };

  // Initial load
  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  // Save deal (Insert or Update)
  const saveDeal = async (dealData: Omit<RealEstateDeal, 'id' | 'created_at'> & { id?: string }) => {
    const client = checkConnection();
    const isEditing = !!dealData.id;
    const nowISO = new Date().toISOString();

    if (client) {
      try {
        if (isEditing) {
          // Update
          const { data, error: sbError } = await client
            .from('deals')
            .update({
              title: dealData.title,
              client_name: dealData.client_name,
              client_phone: dealData.client_phone,
              client_email: dealData.client_email,
              property_type: dealData.property_type,
              property_value: dealData.property_value,
              deal_type: dealData.deal_type,
              description: dealData.description,
              status: dealData.status,
              priority: dealData.priority,
              broker_name: dealData.broker_name
            })
            .eq('id', dealData.id)
            .select();

          if (sbError) throw sbError;
          
          setDeals(prev => prev.map(d => d.id === dealData.id ? { ...d, ...dealData } as RealEstateDeal : d));
        } else {
          // Insert
          const newDeal = {
            title: dealData.title,
            client_name: dealData.client_name,
            client_phone: dealData.client_phone,
            client_email: dealData.client_email,
            property_type: dealData.property_type,
            property_value: dealData.property_value,
            deal_type: dealData.deal_type,
            description: dealData.description,
            status: dealData.status,
            priority: dealData.priority,
            broker_name: dealData.broker_name
          };

          const { data, error: sbError } = await client
            .from('deals')
            .insert([newDeal])
            .select();

          if (sbError) throw sbError;

          if (data && data[0]) {
            setDeals(prev => [data[0] as RealEstateDeal, ...prev]);
          } else {
            // Fallback if no returning data
            loadDeals();
          }
        }
      } catch (err: any) {
        console.error('Erro ao salvar no Supabase:', err);
        throw new Error(err.message || 'Erro ao salvar no banco de dados.');
      }
    } else {
      // Local storage mode
      try {
        const stored = localStorage.getItem('crm_deals');
        let currentDeals: RealEstateDeal[] = stored ? JSON.parse(stored) : [];

        if (isEditing) {
          currentDeals = currentDeals.map(d => 
            d.id === dealData.id 
              ? { ...d, ...dealData } as RealEstateDeal 
              : d
          );
        } else {
          const newLocalDeal: RealEstateDeal = {
            ...(dealData as Omit<RealEstateDeal, 'id' | 'created_at'>),
            id: 'local_' + Math.random().toString(36).substr(2, 9),
            created_at: nowISO,
          };
          currentDeals = [newLocalDeal, ...currentDeals];
        }

        localStorage.setItem('crm_deals', JSON.stringify(currentDeals));
        setDeals(currentDeals);
      } catch (e: any) {
        throw new Error('Falha ao salvar localmente: ' + e.message);
      }
    }
  };

  // Change only status (drag/drop or click move)
  const updateDealStatus = async (id: string, newStatus: DealStatus) => {
    const client = checkConnection();

    if (client) {
      try {
        // Optimistic update for UI feel
        setDeals(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));

        const { error: sbError } = await client
          .from('deals')
          .update({ status: newStatus })
          .eq('id', id);

        if (sbError) throw sbError;
      } catch (err: any) {
        console.error('Erro ao atualizar status no Supabase, revertendo:', err);
        loadDeals(); // Revert from server
        throw new Error(err.message || 'Erro ao atualizar status.');
      }
    } else {
      // Local mode
      try {
        const stored = localStorage.getItem('crm_deals');
        if (stored) {
          const currentDeals: RealEstateDeal[] = JSON.parse(stored);
          const updated = currentDeals.map(d => d.id === id ? { ...d, status: newStatus } : d);
          localStorage.setItem('crm_deals', JSON.stringify(updated));
          setDeals(updated);
        }
      } catch (e: any) {
        console.error('Erro ao atualizar status local:', e);
      }
    }
  };

  // Delete Deal
  const deleteDeal = async (id: string) => {
    const client = checkConnection();

    if (client) {
      try {
        const { error: sbError } = await client
          .from('deals')
          .delete()
          .eq('id', id);

        if (sbError) throw sbError;
        setDeals(prev => prev.filter(d => d.id !== id));
      } catch (err: any) {
        console.error('Erro ao deletar no Supabase:', err);
        throw new Error(err.message || 'Erro ao deletar do Supabase.');
      }
    } else {
      // Local mode
      try {
        const stored = localStorage.getItem('crm_deals');
        if (stored) {
          const currentDeals: RealEstateDeal[] = JSON.parse(stored);
          const filtered = currentDeals.filter(d => d.id !== id);
          localStorage.setItem('crm_deals', JSON.stringify(filtered));
          setDeals(filtered);
        }
      } catch (e: any) {
        console.error('Erro ao deletar localmente:', e);
      }
    }
  };

  // Sync function to push local tasks to Supabase
  const syncLocalToSupabase = async (): Promise<{ successCount: number; errorCount: number }> => {
    const client = checkConnection();
    if (!client) throw new Error('Supabase não conectado.');

    const stored = localStorage.getItem('crm_deals');
    if (!stored) return { successCount: 0, errorCount: 0 };

    const localDeals: RealEstateDeal[] = JSON.parse(stored);
    if (localDeals.length === 0) return { successCount: 0, errorCount: 0 };

    let successCount = 0;
    let errorCount = 0;

    for (const deal of localDeals) {
      try {
        // Prepare for supabase insert (let database generate ID or keep standard fields, omitting local_ prefix)
        const newDeal = {
          title: deal.title,
          client_name: deal.client_name,
          client_phone: deal.client_phone,
          client_email: deal.client_email,
          property_type: deal.property_type,
          property_value: deal.property_value,
          deal_type: deal.deal_type,
          description: deal.description,
          status: deal.status,
          priority: deal.priority,
          broker_name: deal.broker_name
        };

        const { error: sbError } = await client
          .from('deals')
          .insert([newDeal]);

        if (sbError) {
          console.error('Erro ao sincronizar item individual:', sbError);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error('Erro ao sincronizar:', err);
        errorCount++;
      }
    }

    // Clean local storage if successfully synced some items
    if (successCount > 0) {
      localStorage.removeItem('crm_deals');
    }

    await loadDeals();
    return { successCount, errorCount };
  };

  return {
    deals,
    loading,
    error,
    isUsingSupabase,
    loadDeals,
    saveDeal,
    updateDealStatus,
    deleteDeal,
    syncLocalToSupabase
  };
}
