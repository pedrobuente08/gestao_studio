'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calculatorService } from '@/services/calculator.service';
import { CreateCostData, WorkSettingsData } from '@/types/calculator.types';

export function useCalculator() {
  const queryClient = useQueryClient();

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['calculator'],
    queryFn: calculatorService.calculate,
  });

  const addCostMutation = useMutation({
    mutationFn: ({ data, type }: { data: CreateCostData; type: 'fixed' | 'variable' }) => 
      calculatorService.addCost(data, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calculator'] }),
  });

  const updateCostMutation = useMutation({
    mutationFn: ({ id, data, type }: { id: string; data: Partial<CreateCostData>; type: 'fixed' | 'variable' }) => 
      calculatorService.updateCost(id, data, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calculator'] }),
  });

  const removeCostMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'fixed' | 'variable' }) => 
      calculatorService.removeCost(id, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calculator'] }),
  });

  const setWorkSettingsMutation = useMutation({
    mutationFn: calculatorService.setWorkSettings,
    onSuccess: (data) => queryClient.setQueryData(['calculator'], data),
  });

  return {
    result, isLoading, error,
    addCost: addCostMutation.mutate,
    updateCost: updateCostMutation.mutate,
    removeCost: removeCostMutation.mutate,
    setWorkSettings: setWorkSettingsMutation.mutate,
    isAddingCost: addCostMutation.isPending,
    isUpdatingCost: updateCostMutation.isPending,
    isRemovingCost: removeCostMutation.isPending,
    isSettingWorkSettings: setWorkSettingsMutation.isPending,
  };
}
