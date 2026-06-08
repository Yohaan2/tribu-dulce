'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  CreditCard,
  Package,
  Users,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  onMenuToggle: () => void;
  className?: string;
}

export function BottomNavigation({ onMenuToggle, className }: BottomNavigationProps) {
  const pathname = usePathname();

  const navigationItems = [
    { name: 'Ventas', href: '/sales', icon: ShoppingCart },
    { name: 'Deudas', href: '/debts', icon: CreditCard },
    { name: 'Inventario', href: '/products', icon: Package },
    { name: 'Clientes', href: '/clients', icon: Users },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 flex h-16 border-t border-slate-100 bg-white px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] md:hidden pb-safe',
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-md items-center justify-around">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center py-1 text-center transition-all active:scale-95"
            >
              <item.icon
                size={22}
                className={cn(
                  'transition-all duration-200',
                  isActive ? 'text-primary scale-110' : 'text-slate-400'
                )}
              />
              <span
                className={cn(
                  'mt-0.5 text-[10px] font-bold tracking-tight transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-slate-500'
                )}
              >
                {item.name}
              </span>
              {isActive && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}

        {/* Botón de "Más" */}
        <button
          onClick={onMenuToggle}
          className="flex flex-1 flex-col items-center justify-center py-1 text-center transition-all active:scale-95 text-slate-400 hover:text-slate-600"
        >
          <MoreHorizontal size={22} />
          <span className="mt-0.5 text-[10px] font-bold tracking-tight text-slate-500">
            Más
          </span>
        </button>
      </div>
    </nav>
  );
}
