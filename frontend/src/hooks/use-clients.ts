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
    onMutate: async (newClient) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      const previousClients = queryClient.getQueryData<any[]>(['clients']);
      queryClient.setQueryData(['clients'], (old: any) => [
        ...(old || []),
        { ...newClient, id: 'temp-' + Date.now(), createdAt: new Date().toISOString() },
      ]);
      return { previousClients };
    },
    onError: (err, newClient, context) => {
      queryClient.setQueryData(['clients'], context?.previousClients);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientData }) =>
      clientsService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      const previousClients = queryClient.getQueryData<any[]>(['clients']);
      queryClient.setQueryData(['clients'], (old: any) =>
        old?.map((client: any) => client.id === id ? { ...client, ...data } : client)
      );
      return { previousClients };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['clients'], context?.previousClients);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: clientsService.remove,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      const previousClients = queryClient.getQueryData<any[]>(['clients']);
      queryClient.setQueryData(['clients'], (old: any) =>
        old?.filter((client: any) => client.id !== id)
      );
      return { previousClients };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['clients'], context?.previousClients);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
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
