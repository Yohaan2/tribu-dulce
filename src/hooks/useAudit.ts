import { useQuery } from '@tanstack/react-query';
import { AuditLog } from '@/types';
import { authFetch } from '@/lib/api';

async function fetchAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  const res = await authFetch(`/api/audit?limit=${limit}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useAudit(limit: number = 100) {
  const logsQuery = useQuery({
    queryKey: ['audit', limit],
    queryFn: () => fetchAuditLogs(limit),
  });

  return {
    logs: logsQuery.data || [],
    isLoading: logsQuery.isLoading,
    error: logsQuery.error,
    refetch: logsQuery.refetch,
  };
}
