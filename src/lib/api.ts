import { getClientToken, clearClientAuth } from './auth/client';

export async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = getClientToken();
  const provider = (process.env.NEXT_PUBLIC_DATABASE_PROVIDER || process.env.DATABASE_PROVIDER || 'postgres').toLowerCase();

  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Si recibimos un 401 (No autorizado), limpiamos auth y redirigimos si es postgres provider
  if (response.status === 401 && provider === 'postgres') {
    if (typeof window !== 'undefined') {
      clearClientAuth();
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = `/login?reason=session_expired&redirect=${encodeURIComponent(currentPath)}`;
      }
    }
  }

  return response;
}
