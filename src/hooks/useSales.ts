import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sale } from '@/types';
import { CreateSaleInput } from '@/schemas/sale.schema';
import { authFetch } from '@/lib/api';

async function fetchSales(): Promise<Sale[]> {
  const res = await authFetch('/api/sales');
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function createSale(input: CreateSaleInput): Promise<Sale> {
  const res = await authFetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function updateSale({
  id,
  status,
  items,
}: {
  id: string;
  status?: 'PAID' | 'PENDING' | 'PARTIAL';
  items?: Array<{ product_id: string; quantity: number; unit_price: number }>;
}): Promise<Sale> {
  const res = await authFetch(`/api/sales/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, items }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useSales() {
  const queryClient = useQueryClient();

  const salesQuery = useQuery({
    queryKey: ['sales'],
    queryFn: fetchSales,
  });

  const createMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });

  const updateSaleMutation = useMutation({
    mutationFn: updateSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });

  return {
    sales: salesQuery.data || [],
    isLoading: salesQuery.isLoading,
    error: salesQuery.error,
    createSale: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateSaleStatus: updateSaleMutation.mutateAsync,
    isUpdatingStatus: updateSaleMutation.isPending,
    updateSale: updateSaleMutation.mutateAsync,
    isUpdatingSale: updateSaleMutation.isPending,
  };
}
