import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from './lib/auth/jwt';

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;
    return Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // Inicializar respuesta base
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const nextPath = request.nextUrl.pathname;

  // Ignorar peticiones a la API o recursos estáticos para el middleware de redirección
  if (
    nextPath.startsWith('/_next') ||
    nextPath.startsWith('/api/') ||
    nextPath === '/favicon.ico' ||
    nextPath.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return response;
  }

  const provider = process.env.DATABASE_PROVIDER?.toLowerCase() || 'postgres';
  const protectedRoutes = ['/dashboard', '/clients', '/products', '/sales', '/sales-history', '/debts', '/calendar', '/settings', '/audit'];
  const isProtectedRoute = protectedRoutes.some((route) => nextPath === route || nextPath.startsWith(`${route}/`));

  // =========================================================================
  // FLUJO POSTGRES AUTH
  // =========================================================================
  if (provider === 'postgres') {
    const tokenCookie = request.cookies.get('auth_token');
    const token = tokenCookie?.value;
    const isAuthenticated = !!token && isTokenValid(token);

    if (isProtectedRoute && !isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Proteger /audit solo para SUPERADMIN
    if (nextPath === '/audit' || nextPath.startsWith('/audit/')) {
      const payload = token ? verifyToken(token) : null;
      if (!payload || (payload.role !== 'SUPERADMIN' && payload.role !== 'ADMIN')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    if (isAuthenticated && (nextPath === '/login' || nextPath === '/')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
  }

  // =========================================================================
  // FLUJO SUPABASE AUTH
  // =========================================================================
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Intentar verificar sesión de Supabase
    const { data: { user } } = await supabase.auth.getUser();

    const isAuthenticated = !!user;

    if (isProtectedRoute && !isAuthenticated) {
      // Redirigir a login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Si ya está autenticado e intenta ir a login o raíz, redirigir a dashboard
    if (isAuthenticated && (nextPath === '/login' || nextPath === '/')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

  } catch (error) {
    console.error('Error en middleware Supabase:', error);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
