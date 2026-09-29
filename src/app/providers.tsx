'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutos
          },
        },
      })
  );

  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const identity = useAuthStore((state) => state.user ? `${state.user.id}:${state.user.role}` : undefined);
  const previousIdentity = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousIdentity.current !== identity) queryClient.clear();
    previousIdentity.current = identity;
  }, [identity, queryClient]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
