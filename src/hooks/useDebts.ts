import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sale, Payment } from '@/types';
import { authFetch } from '@/lib/api';

async function fetchDebts(): Promise<Sale[]> {
  const res = await authFetch('/api/debts');
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function payDebt({ clientId, amountUsd, amountBs }: { clientId: string; amountUsd: number; amountBs: number }): Promise<any> {
  const res = await authFetch(`/api/clients/${clientId}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount_usd: amountUsd, amount_bs: amountBs }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useDebts() {
  const queryClient = useQueryClient();

  const debtsQuery = useQuery({
    queryKey: ['debts'],
    queryFn: fetchDebts,
  });

  const payMutation = useMutation({
    mutationFn: payDebt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    debts: debtsQuery.data || [],
    isLoading: debtsQuery.isLoading,
    error: debtsQuery.error,
    payDebt: payMutation.mutateAsync,
    isPaying: payMutation.isPending,
  };
}
