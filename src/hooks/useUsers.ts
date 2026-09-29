import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { UserProfile } from '@/types';
import { CreateUserSchema, UpdateUserSchema } from '@/schemas/user.schema';
import { z } from 'zod';

async function requestUsers(url: string, init?: RequestInit) {
  const response = await authFetch(url, init);
  const json = await response.json();
  if (!response.ok || !json.success) throw new Error(json.error || 'Error al gestionar usuarios');
  return json.data;
}

export interface SellerProfile {
  id: string;
  name: string;
  is_active: boolean;
  deleted_at: string | null;
}

export function useSellers(enabled: boolean) {
  return useQuery<SellerProfile[]>({
    queryKey: ['sellers'],
    queryFn: () => requestUsers('/api/users?scope=sellers'),
    enabled,
  });
}

export function useUsers() {
  const queryClient = useQueryClient();
  const users = useQuery<UserProfile[]>({ queryKey: ['users'], queryFn: () => requestUsers('/api/users') });
  const create = useMutation({
    mutationFn: (input: z.infer<typeof CreateUserSchema>) => requestUsers('/api/users', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-chart'] });
    },
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: z.infer<typeof UpdateUserSchema> }) => requestUsers(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-chart'] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => requestUsers(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-chart'] });
    },
  });
  return { users: users.data || [], isLoading: users.isLoading, error: users.error, create: create.mutateAsync, update: update.mutateAsync, remove: remove.mutateAsync };
}
