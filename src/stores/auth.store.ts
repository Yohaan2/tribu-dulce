import { create } from 'zustand';
import { UserProfile, UserRole } from '@/types';
import { authProvider } from '@/lib/auth';

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
    try {
      const user = await authProvider.getCurrentUser();
      set({ user, loading: false });
    } catch (error) {
      console.error('Error inicializando auth:', error);
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    set({ loading: true });
    try {
      await authProvider.logout();
      set({ user: null, loading: false });
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      set({ loading: false });
    }
  },
  hasRole: (roles) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role);
  },
}));
