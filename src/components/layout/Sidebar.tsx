'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Productos', href: '/products', icon: Package },
    { name: 'Ventas', href: '/sales', icon: ShoppingCart },
    { name: 'Historial', href: '/sales-history', icon: History },
    { name: 'Deudas', href: '/debts', icon: CreditCard },
    { name: 'Calendario', href: '/calendar', icon: Calendar },
    { name: 'Configuración', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-100 bg-white shadow-sm transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Botón de Colapso */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 md:flex hidden"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Cabecera / Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary text-white font-black shadow-md shadow-primary/10">
            TD
          </span>
          {!isCollapsed && (
            <span className="text-lg font-black tracking-tight text-slate-800">
              Tribu <span className="text-primary">Dulce</span>
            </span>
          )}
        </Link>
      </div>

      {/* Perfil del Usuario en Sidebar */}
      {!isCollapsed && user && (
        <div className="mx-4 my-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sesión como</p>
          <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
          <span className="mt-1 inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/10">
            {user.role}
          </span>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  'transition-colors',
                  isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Pie del Sidebar / Cerrar Sesión */}
      <div className="border-t border-slate-100 p-4">
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors'
          )}
        >
          <LogOut size={20} className="text-slate-400 group-hover:text-rose-600" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
