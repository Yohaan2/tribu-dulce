'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  if (paths.length === 0) return null;

  // Mapa de traducciones de rutas para la UI
  const routeMap: Record<string, string> = {
    dashboard: 'Dashboard',
    clients: 'Clientes',
    products: 'Productos',
    sales: 'Ventas',
    'sales-history': 'Historial de Ventas',
    debts: 'Deudas',
    calendar: 'Calendario',
    settings: 'Configuración',
    login: 'Login',
  };

  return (
    <nav className="flex items-center space-x-1.5 text-xs font-medium text-slate-500 py-3">
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
        <Home size={14} />
      </Link>

      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join('/')}`;
        const isLast = index === paths.length - 1;
        const displayName = routeMap[path] || decodeURIComponent(path);

        return (
          <div key={href} className="flex items-center space-x-1.5">
            <ChevronRight size={14} className="text-slate-300" />
            {isLast ? (
              <span className="font-semibold text-slate-800">{displayName}</span>
            ) : (
              <Link href={href} className="hover:text-slate-900 transition-colors">
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
