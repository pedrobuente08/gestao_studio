'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService } from '@/services/financial.service';
import { CreateTransactionData, UpdateTransactionData } from '@/types/financial.types';

export function useFinancial(params?: { type?: string; category?: string; startDate?: string; endDate?: string }) {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading: isLoadingTransactions, isError: isErrorTransactions } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => financialService.getAll(params),
  });

  const { data: summary, isLoading: isLoadingSummary, isError: isErrorSummary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: financialService.getSummary,
  });

  const createMutation = useMutation({
    mutationFn: financialService.create,
    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ queryKey: ['transactions', params] });
      const previousTransactions = queryClient.getQueryData<any[]>(['transactions', params]);
      queryClient.setQueryData(['transactions', params], (old: any) => [
        ...(old || []),
        { ...newTransaction, id: 'temp-' + Date.now(), createdAt: new Date().toISOString() },
      ]);
      return { previousTransactions };
    },
    onError: (err, newTransaction, context) => {
      queryClient.setQueryData(['transactions', params], context?.previousTransactions);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionData }) => 
      financialService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['transactions', params] });
      const previousTransactions = queryClient.getQueryData<any[]>(['transactions', params]);
      queryClient.setQueryData(['transactions', params], (old: any) =>
        old?.map((t: any) => t.id === id ? { ...t, ...data } : t)
      );
      return { previousTransactions };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['transactions', params], context?.previousTransactions);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: financialService.remove,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['transactions', params] });
      const previousTransactions = queryClient.getQueryData<any[]>(['transactions', params]);
      queryClient.setQueryData(['transactions', params], (old: any) =>
        old?.filter((t: any) => t.id !== id)
      );
      return { previousTransactions };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['transactions', params], context?.previousTransactions);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });

  return {
    transactions,
    summary,
    isLoading: isLoadingTransactions || isLoadingSummary,
    isError: isErrorTransactions || isErrorSummary,
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    removeTransaction: removeMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
