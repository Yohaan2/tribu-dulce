import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sale, Payment } from '@/types';

async function fetchDebts(): Promise<Sale[]> {
  const res = await fetch('/api/debts');
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function payDebt({ saleId, amountUsd, amountBs }: { saleId: string; amountUsd: number; amountBs: number }): Promise<Payment> {
  const res = await fetch(`/api/debts/${saleId}/pay`, {
    method: 'PATCH',
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
