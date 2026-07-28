'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Inicializar la autenticación si no se ha hecho
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCF8F7]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#541919] border-t-transparent" />
          <span className="text-sm font-bold text-[#7A6E6D]">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  // Si no hay usuario y no está cargando, la redirección ocurrirá en el useEffect
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
