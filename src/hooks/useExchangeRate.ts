import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExchangeRate } from '@/types';
import { authFetch } from '@/lib/api';

async function fetchExchangeRate(): Promise<ExchangeRate> {
  const res = await authFetch('/api/exchange-rate');
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function updateExchangeRate({ rate, source }: { rate: number; source: string }): Promise<ExchangeRate> {
  const res = await authFetch('/api/exchange-rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rate, source }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useExchangeRate() {
  const queryClient = useQueryClient();

  const exchangeRateQuery = useQuery({
    queryKey: ['exchange-rate'],
    queryFn: fetchExchangeRate,
  });

  const updateMutation = useMutation({
    mutationFn: updateExchangeRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rate'] });
    },
  });

  return {
    exchangeRate: exchangeRateQuery.data,
    isLoading: exchangeRateQuery.isLoading,
    error: exchangeRateQuery.error,
    updateExchangeRate: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
