import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tribu Dulce - Gestión de Ventas',
    short_name: 'Tribu Dulce',
    description: 'Sistema de gestión de ventas y cuentas por cobrar',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#d87c88',
    theme_color: '#d87c88',
    orientation: 'portrait',
    lang: 'es',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
