'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsService } from '@/services/sessions.service';
import { CreateSessionData, UpdateSessionData } from '@/types/session.types';

export function useSessions() {
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: sessionsService.create,
    onMutate: async (newSession) => {
      await queryClient.cancelQueries({ queryKey: ['sessions'] });
      const previousSessions = queryClient.getQueryData<any[]>(['sessions']);
      queryClient.setQueryData(['sessions'], (old: any) => [
        ...(old || []),
        { ...newSession, id: 'temp-' + Date.now(), createdAt: new Date().toISOString() },
      ]);
      return { previousSessions };
    },
    onError: (err, newSession, context) => {
      queryClient.setQueryData(['sessions'], context?.previousSessions);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionData }) => 
      sessionsService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['sessions'] });
      const previousSessions = queryClient.getQueryData<any[]>(['sessions']);
      queryClient.setQueryData(['sessions'], (old: any) =>
        old?.map((session: any) => session.id === id ? { ...session, ...data } : session)
      );
      return { previousSessions };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['sessions'], context?.previousSessions);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: sessionsService.remove,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['sessions'] });
      const previousSessions = queryClient.getQueryData<any[]>(['sessions']);
      queryClient.setQueryData(['sessions'], (old: any) =>
        old?.filter((session: any) => session.id !== id)
      );
      return { previousSessions };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['sessions'], context?.previousSessions);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    sessions, isLoading, error,
    createSession: createMutation.mutate,
    updateSession: updateMutation.mutate,
    removeSession: removeMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => sessionsService.getById(id),
    enabled: !!id,
  });
}
