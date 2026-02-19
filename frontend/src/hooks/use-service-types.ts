'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceTypesService } from '@/services/service-types.service';
import { CreateServiceTypeData } from '@/types/service-type.types';

export function useServiceTypes() {
  const queryClient = useQueryClient();

  const { data: serviceTypes = [], isLoading } = useQuery({
    queryKey: ['service-types'],
    queryFn: serviceTypesService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateServiceTypeData) => serviceTypesService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-types'] }),
  });

  const removeMutation = useMutation({
    mutationFn: serviceTypesService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-types'] }),
  });

  return {
    serviceTypes,
    isLoading,
    createServiceType: createMutation.mutate,
    removeServiceType: removeMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
