import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PredictionSummary, PredictionHistoryItem } from '@/types';
import { CreatePredictionItemInput } from '@/schemas/prediction.schema';
import { authFetch } from '@/lib/api';

async function fetchActivePrediction(): Promise<PredictionSummary | null> {
  const res = await authFetch('/api/predictions');
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function addPredictionItem(input: CreatePredictionItemInput): Promise<PredictionSummary> {
  const res = await authFetch('/api/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function deletePredictionItem(itemId: string): Promise<PredictionSummary> {
  const res = await authFetch(`/api/predictions/items/${itemId}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function resetPrediction(notes?: string): Promise<any> {
  const res = await authFetch('/api/predictions/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function fetchPredictionHistory(): Promise<PredictionHistoryItem[]> {
  const res = await authFetch('/api/predictions/history');
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data || [];
}

export async function fetchPredictionById(id: string): Promise<PredictionSummary> {
  const res = await authFetch(`/api/predictions/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function usePredictions() {
  const queryClient = useQueryClient();

  const activeQuery = useQuery({
    queryKey: ['predictions', 'active'],
    queryFn: fetchActivePrediction,
    refetchInterval: 30000, // Refrescar automáticamente cada 30 segundos
  });

  const historyQuery = useQuery({
    queryKey: ['predictions', 'history'],
    queryFn: fetchPredictionHistory,
  });

  const addMutation = useMutation({
    mutationFn: addPredictionItem,
    onSuccess: (updatedSummary) => {
      queryClient.setQueryData(['predictions', 'active'], updatedSummary);
      queryClient.invalidateQueries({ queryKey: ['predictions', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['predictions', 'history'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePredictionItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['predictions', 'history'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetPrediction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['predictions', 'history'] });
    },
  });

  return {
    summary: activeQuery.data || null,
    isLoading: activeQuery.isLoading,
    error: activeQuery.error,
    refetchActive: activeQuery.refetch,
    
    history: historyQuery.data || [],
    isHistoryLoading: historyQuery.isLoading,
    refetchHistory: historyQuery.refetch,

    addPredictionItem: addMutation.mutateAsync,
    isAdding: addMutation.isPending,

    deletePredictionItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    resetPrediction: resetMutation.mutateAsync,
    isResetting: resetMutation.isPending,

    getPredictionById: fetchPredictionById,
  };
}
