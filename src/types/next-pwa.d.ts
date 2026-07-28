declare module 'next-pwa' {
  import type { NextConfig } from 'next';

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    skipWaiting?: boolean;
    dynamicStartUrl?: boolean;
    reloadOnOnline?: boolean;
    buildExcludes?: (string | RegExp)[];
    publicExcludes?: string[];
    fallbacks?: {
      [key: string]: string;
    };
    cacheOnFrontEndNav?: boolean;
    subdomainPrefix?: string;
  }

  function withPWA(
    pwaConfig?: PWAConfig
  ): (nextConfig?: NextConfig) => NextConfig;

  export default withPWA;
}
