import { useQuery } from '@tanstack/react-query';
import { AuditLog } from '@/types';
import { authFetch } from '@/lib/api';

interface FetchAuditResponse {
  data: AuditLog[];
  total: number;
  totalPages: number;
}

async function fetchAuditLogs(
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<FetchAuditResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const res = await authFetch(`/api/audit?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);

  return {
    data: json.data || [],
    total: json.pagination?.total || 0,
    totalPages: json.pagination?.totalPages || 0,
  };
}

export function useAudit(
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string
) {
  const logsQuery = useQuery({
    queryKey: ['audit', page, limit, startDate, endDate],
    queryFn: () => fetchAuditLogs(page, limit, startDate, endDate),
  });

  return {
    logs: logsQuery.data?.data || [],
    total: logsQuery.data?.total || 0,
    totalPages: logsQuery.data?.totalPages || 0,
    isLoading: logsQuery.isLoading,
    error: logsQuery.error,
    refetch: logsQuery.refetch,
  };
}
