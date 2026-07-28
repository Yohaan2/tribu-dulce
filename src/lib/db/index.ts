import { DatabaseAdapter } from './interface';
import { SupabaseAdapter } from './supabase';
import { PostgresAdapter } from './postgres';

function getDatabaseProvider(provider?: string): DatabaseAdapter {
  const normalizedProvider = provider?.toLowerCase() || 'postgres';

  switch (normalizedProvider) {
    case 'supabase':
      return new SupabaseAdapter();
    case 'postgres':
    case 'postgresql':
    default:
      return new PostgresAdapter();
  }
}

// Instancia única exportada para toda la aplicación
export const db = getDatabaseProvider(process.env.DATABASE_PROVIDER);

// Re-exportar interfaz para facilidad de uso
export * from './interface';
