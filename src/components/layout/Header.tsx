'use client';

import { Menu, Bell, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { formatCurrencyBs } from '@/lib/utils';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: '800',
  subsets: ['latin'],
  display: 'swap',
});

interface HeaderProps {
  onMenuToggle?: () => void;
  title?: string;
}

export function Header({ onMenuToggle, title = 'Tribu Dulce' }: HeaderProps) {
  const user = useAuthStore((state) => state.user);
  const { exchangeRate } = useExchangeRate();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-6">
      {/* Lado Izquierdo: Toggle Móvil y Título */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className={`text-xl font-bold text-primary md:text-2xl ${plusJakartaSans.className}`}>{title}</h1>
      </div>

      {/* Lado Derecho: Tasa de cambio, Notificaciones, Perfil */}
      <div className="flex items-center gap-4">
        {/* Widget Tasa de Cambio (Sleek Ribbon) */}
        {exchangeRate && (
          <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            <TrendingUp size={16} className="text-amber-600" />
            <span className="font-bold text-amber-900">$/{formatCurrencyBs(exchangeRate.rate)}</span>
          </div>
        )}

        {/* Info Perfil */}
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500 text-sm font-bold text-white shadow-sm">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-bold text-slate-800 leading-none">{user.name}</p>
              <p className="mt-1 text-xs text-slate-400 leading-none">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
