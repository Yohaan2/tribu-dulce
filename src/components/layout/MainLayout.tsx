'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { Container } from './Container';
import { BottomNavigation } from './BottomNavigation';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Automatically close the mobile sidebar drawer when the route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background-alt text-foreground font-sans">
      {/* Sidebar de Escritorio */}
      <Sidebar className="hidden md:flex" />

      {/* Sidebar Móvil (Deslizante con Overlay) */}
      <div
        className={cn(
          'fixed inset-0 z-40 flex md:hidden transition-opacity duration-300',
          isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        {/* Overlay */}
        <div
          onClick={() => setIsMobileOpen(false)}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        />

        {/* Contenedor del Sidebar */}
        <div
          className={cn(
            'relative flex w-64 max-w-xs flex-1 flex-col bg-white transition-transform duration-300 ease-in-out',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <Sidebar className="h-full w-full border-r-0" />
        </div>
      </div>

      {/* Area de Contenido Principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header superior */}
        <Header onMenuToggle={() => setIsMobileOpen(true)} title={title} />

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto px-1 pt-4 pb-20 md:py-6">
          <Container>
            {/* Fila de Breadcrumbs */}
            <Breadcrumbs />

            {/* Contenido de la Página */}
            <div className="mt-1 pb-12">{children}</div>
          </Container>
        </main>
      </div>

      {/* Barra de Navegación Inferior en Móvil */}
      <BottomNavigation onMenuToggle={() => setIsMobileOpen(true)} />
    </div>
  );
}
