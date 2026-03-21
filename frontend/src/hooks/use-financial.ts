'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService } from '@/services/financial.service';
import { CreateTransactionData, UpdateTransactionData, CreateRecurringExpenseData, UpdateRecurringExpenseData } from '@/types/financial.types';

export function useFinancialMonthlySummary() {
  return useQuery({
    queryKey: ['financial-monthly-summary'],
    queryFn: financialService.getMonthlySummary,
  });
}

export function useFinancialRevenueSplit(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['financial-revenue-split', params],
    queryFn: () => financialService.getRevenueSplit(params),
  });
}

export function useFinancial(params?: { type?: string; category?: string; startDate?: string; endDate?: string; userId?: string }) {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading: isLoadingTransactions, isError: isErrorTransactions } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => financialService.getAll(params),
  });

  const { data: summary, isLoading: isLoadingSummary, isError: isErrorSummary } = useQuery({
    queryKey: ['financial-summary', params?.startDate, params?.endDate, params?.userId],
    queryFn: () => financialService.getSummary({ startDate: params?.startDate, endDate: params?.endDate, userId: params?.userId }),
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
      queryClient.invalidateQueries({ queryKey: ['financial-monthly-summary'] });
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
      queryClient.invalidateQueries({ queryKey: ['financial-monthly-summary'] });
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
      queryClient.invalidateQueries({ queryKey: ['financial-monthly-summary'] });
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

export function useRecurringExpenses() {
  const queryClient = useQueryClient();

  const { data: recurring = [], isLoading } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: financialService.listRecurring,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRecurringExpenseData) => financialService.createRecurring(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringExpenseData }) =>
      financialService.updateRecurring(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financialService.deleteRecurring(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] }),
  });

  const processMutation = useMutation({
    mutationFn: financialService.processMonthlyRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });

  return {
    recurring,
    isLoading,
    createRecurring: createMutation.mutate,
    updateRecurring: updateMutation.mutate,
    deleteRecurring: deleteMutation.mutate,
    processRecurring: processMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isProcessing: processMutation.isPending,
    processResult: processMutation.data,
  };
}
