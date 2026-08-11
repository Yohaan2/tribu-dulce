import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Client } from '@/types';
import { CreateClientInput, UpdateClientInput } from '@/schemas/client.schema';
import { authFetch } from '@/lib/api';

interface FetchClientsResponse {
  data: Client[];
  total: number;
  totalPages: number;
}

// Helper de peticiones fetch
async function fetchClients(page: number = 1, limit: number = 10, search: string = ''): Promise<FetchClientsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search.trim()) params.set('search', search.trim());

  const res = await authFetch(`/api/clients?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return {
    data: json.data || [],
    total: json.pagination?.total || 0,
    totalPages: json.pagination?.totalPages || 0,
  };
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

async function getClientByName(name: string): Promise<Client> {
  const res = await authFetch(`/api/clients?name=${encodeURIComponent(name)}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useClients(page: number = 1, limit: number = 10, search: string = '') {
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ['clients', page, limit, search],
    queryFn: () => fetchClients(page, limit, search),
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

  const getClientByNameMutation = useMutation({
    mutationFn: getClientByName,
  });

  return {
    clients: clientsQuery.data?.data || [],
    total: clientsQuery.data?.total || 0,
    totalPages: clientsQuery.data?.totalPages || 0,
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
    getClientByName: getClientByNameMutation.mutateAsync,
    isGettingClientByName: getClientByNameMutation.isPending,
  };
}
