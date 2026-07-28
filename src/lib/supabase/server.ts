import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const provider = (
    process.env.DATABASE_PROVIDER ||
    process.env.NEXT_PUBLIC_DATABASE_PROVIDER ||
    'postgres'
  ).toLowerCase();

  if (provider !== 'supabase') {
    throw new Error(
      'El cliente de Supabase solo debe iniciarse cuando DATABASE_PROVIDER sea "supabase".'
    );
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se puede ignorar si se llama desde Server Components.
            // El middleware se encargará de refrescar la sesión del usuario.
          }
        },
      },
    }
  );
}
