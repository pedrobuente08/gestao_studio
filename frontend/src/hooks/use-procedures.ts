'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proceduresService } from '@/services/procedures.service';
import { CreateProcedureData, UpdateProcedureData } from '@/types/procedure.types';

export function useProcedures() {
  const queryClient = useQueryClient();

  const { data: procedures = [], isLoading, error } = useQuery({
    queryKey: ['procedures'],
    queryFn: proceduresService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: proceduresService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProcedureData }) => 
      proceduresService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  });

  const removeMutation = useMutation({
    mutationFn: proceduresService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  });

  return {
    procedures, isLoading, error,
    createProcedure: createMutation.mutate,
    updateProcedure: updateMutation.mutate,
    removeProcedure: removeMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useProcedure(id: string) {
  return useQuery({
    queryKey: ['procedures', id],
    queryFn: () => proceduresService.getById(id),
    enabled: !!id,
  });
}
