import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://tribu-dulce.shop'),
  manifest: '/manifest.webmanifest',
  title: "Tribu Dulce - Gestión de Ventas",
  description: "Sistema de gestión de ventas y cuentas por cobrar",
    keywords: [
    'nextjs',
    'react',
    'saas',
    'dashboard',
    'software',
  ],
  applicationName: 'Tribu Dulce',
    authors: [
    {
      name: 'Tribu Dulce',
      url: 'https://tribu-dulce.shop',
    },
  ],
  creator: 'Tribu Dulce',
  publisher: 'Tribu Dulce',
  category: 'Technology',
  openGraph: {
    title: 'Tribu Dulce',
    description:
      'Sistema de gestión de ventas y cuentas por cobrar',
    url: 'https://tribu-dulce.shop',
    siteName: 'Tribu Dulce',
    locale: 'es_ES',
    type: 'website',

    images: [
      {
        url: '/tribu-logo.png',
        width: 1200,
        height: 630,
        alt: 'Tribu Dulce',
      },
    ],
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
      },
      {
        url: '/icon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/icon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],

    shortcut: ['/favicon.ico'],
    apple: [
      {
        url: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background-alt text-foreground antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
