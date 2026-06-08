import { create } from 'zustand';
import { UserProfile, UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  initializeAuth: async () => {
    set({ loading: true });
    if (typeof window !== 'undefined') {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profileError && profileData) {
          set({
            user: {
              id: session.user.id,
              name: profileData.name || session.user.email?.split('@')[0] || 'Usuario',
              role: profileData.role || 'EMPLOYEE',
              created_at: profileData.created_at || session.user.created_at,
            },
            loading: false,
          });
        } else {
          set({ user: null, loading: false });
        }
      } else {
        set({ user: null, loading: false });
      }
    } else {
      set({ loading: false });
    }
  },
  logout: async () => {
    set({ loading: true });
    if (typeof window !== 'undefined') {
      const supabase = createClient();
      await supabase.auth.signOut();
      set({ user: null, loading: false });
      window.location.href = '/login';
    } else {
      set({ user: null, loading: false });
    }
  },
  hasRole: (roles) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role);
  },
}));
