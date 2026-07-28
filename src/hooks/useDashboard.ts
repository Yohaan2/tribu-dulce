import { useQuery } from '@tanstack/react-query';
import { DashboardStats } from '@/types';
import { authFetch } from '@/lib/api';

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await authFetch('/api/dashboard');
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useDashboard() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refrescar automáticamente cada 30 segundos
  });

  return {
    stats: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
  };
}
