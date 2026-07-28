import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Client } from '@/types';
import { CreateClientInput, UpdateClientInput } from '@/schemas/client.schema';
import { authFetch } from '@/lib/api';

// Helper de peticiones fetch
async function fetchClients(page: number = 1, limit: number = 10): Promise<Client[]> {
  const res = await authFetch(`/api/clients?page=${page}&limit=${limit}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function createClient(input: CreateClientInput): Promise<Client> {
  const res = await authFetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function updateClient({ id, input }: { id: string; input: UpdateClientInput }): Promise<Client> {
  const res = await authFetch(`/api/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function deleteClient(id: string): Promise<void> {
  const res = await authFetch(`/api/clients/${id}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
}

async function getClientByID(id: string): Promise<Client> {
  const res = await authFetch(`/api/clients/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useClients(page: number = 1, limit: number = 10) {
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ['clients', page, limit],
    queryFn: () => fetchClients(page, limit),
  });

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const getClientByIdMutation = useMutation({
    mutationFn: getClientByID,
  });

  return {
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    createClient: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateClient: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteClient: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    getClientById: getClientByIdMutation.mutateAsync,
    isGettingClientById: getClientByIdMutation.isPending,
  };
}
