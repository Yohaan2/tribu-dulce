import { UserProfile } from '@/types';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { getClientToken, getClientUser, setClientAuth, clearClientAuth, isTokenExpired } from './client';

export interface AuthUserResponse {
  user: UserProfile;
  token?: string;
}

export interface AuthProvider {
  getCurrentUser(): Promise<UserProfile | null>;
  logout(): Promise<void>;
  getProviderName(): 'supabase' | 'postgres';
}

class SupabaseAuthProvider implements AuthProvider {
  getProviderName(): 'supabase' | 'postgres' {
    return 'supabase';
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    const supabase = createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profileData) {
        return {
          id: session.user.id,
          name: profileData.name || session.user.email?.split('@')[0] || 'Usuario',
          role: profileData.role || 'EMPLOYEE',
          created_at: profileData.created_at || session.user.created_at,
        };
      }
    }
    return null;
  }

  async logout(): Promise<void> {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
  }
}

class PostgresAuthProvider implements AuthProvider {
  getProviderName(): 'supabase' | 'postgres' {
    return 'postgres';
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    const token = getClientToken();
    const cachedUser = getClientUser();

    if (!token || isTokenExpired(token)) {
      clearClientAuth();
      return null;
    }

    try {
      // Intentar validar contra el endpoint /api/auth/me para estar seguros
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const { data } = await res.json();
        if (data?.user) {
          setClientAuth(token, data.user);
          return data.user;
        }
      } else if (res.status === 401) {
        clearClientAuth();
        return null;
      }
    } catch (error) {
      console.error('Error verificando sesión postgres:', error);
    }

    // Fallback al cache del cliente si falló la red pero el token no está expirado
    return cachedUser;
  }

  async logout(): Promise<void> {
    clearClientAuth();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error al llamar logout endpoint:', error);
    }
  }
}

export function getAuthProvider(provider?: string): AuthProvider {
  const normalizedProvider = provider?.toLowerCase() || 'postgres';

  switch (normalizedProvider) {
    case 'supabase':
      return new SupabaseAuthProvider();
    case 'postgres':
    case 'postgresql':
    default:
      return new PostgresAuthProvider();
  }
}

const activeProvider = process.env.NEXT_PUBLIC_DATABASE_PROVIDER || process.env.DATABASE_PROVIDER;
export const authProvider = getAuthProvider(activeProvider);
