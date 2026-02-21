'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '@/services/clients.service';
import { CreateClientData, UpdateClientData } from '@/types/client.types';

export function useClients() {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getAll,
  });

  const useClient = (id: string) => useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsService.getById(id),
    enabled: !!id,
  });

  const createClientMutation = useMutation({
    mutationFn: clientsService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientData }) =>
      clientsService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const removeMutation = useMutation({
    mutationFn: clientsService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  return {
    clients,    isLoading,
    useClient,
    createClient: createClientMutation.mutate,
    updateClient: updateMutation.mutate,
    removeClient: removeMutation.mutate,
    isCreating: createClientMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
    createError: createClientMutation.error,
    updateError: updateMutation.error,
  };
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsService.getById(id),
    enabled: !!id,
  });
}
