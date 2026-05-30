import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from './types';

// Let's check if we have env variables
const ENV_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const ENV_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Get config from localStorage or env
export function getSavedConfig(): SupabaseConfig | null {
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_key');

  if (localUrl && localKey) {
    return { url: localUrl, anonKey: localKey };
  }

  if (ENV_URL && ENV_KEY && ENV_URL !== 'https://your-project-id.supabase.co' && ENV_KEY !== 'your-anon-key') {
    return { url: ENV_URL, anonKey: ENV_KEY };
  }

  return null;
}

export function saveConfig(url: string, key: string) {
  if (!url || !key) {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
  } else {
    localStorage.setItem('supabase_url', url.trim());
    localStorage.setItem('supabase_key', key.trim());
  }
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedConfig();
  if (!config) {
    cachedClient = null;
    return null;
  }

  const currentKey = `${config.url}_${config.anonKey}`;
  if (cachedClient && cachedConfigKey === currentKey) {
    return cachedClient;
  }

  try {
    // Basic validation
    if (!config.url.startsWith('http')) {
      return null;
    }
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false
      }
    });
    cachedConfigKey = currentKey;
    return cachedClient;
  } catch (error) {
    console.error('Erro ao inicializar cliente Supabase:', error);
    return null;
  }
}

export const SUPABASE_SQL_SCRIPT = `-- SCHEMA PARA O SEU SUPABASE
-- Execute esse script no Editor SQL (SQL Editor) do seu projeto Supabase

create table if not exists deals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  client_name text not null,
  client_phone text,
  client_email text,
  property_type text not null,
  property_value numeric,
  deal_type text not null,
  description text,
  status text not null,
  priority text not null,
  broker_name text
);

-- Habilitar leitura/escrita pública temporária (ou configure de acordo com sua autenticação)
alter table deals enable row level security;

create policy "Permitir acesso público total para testes"
  on deals for all
  using (true)
  with check (true);
`;
