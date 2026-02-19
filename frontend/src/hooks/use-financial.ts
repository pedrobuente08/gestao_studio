'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService } from '@/services/financial.service';
import { CreateTransactionData, UpdateTransactionData } from '@/types/financial.types';

export function useFinancial(params?: { type?: string; category?: string; startDate?: string; endDate?: string }) {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => financialService.getAll(params),
  });

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: financialService.getSummary,
  });

  const createMutation = useMutation({
    mutationFn: financialService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionData }) => 
      financialService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: financialService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });

  return {
    transactions,
    summary,
    isLoading: isLoadingTransactions || isLoadingSummary,
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    removeTransaction: removeMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
