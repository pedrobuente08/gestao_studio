import api from './api';
import { Transaction, CreateTransactionData, UpdateTransactionData, FinancialSummary, RecurringExpense, CreateRecurringExpenseData, UpdateRecurringExpenseData } from '@/types/financial.types';

export const financialService = {
  async getAll(params?: { type?: string; category?: string; startDate?: string; endDate?: string; userId?: string }): Promise<Transaction[]> {
    const res = await api.get<{ data: Transaction[] } | Transaction[]>('/financial', { params });
    return Array.isArray(res.data) ? res.data : (res.data as { data: Transaction[] }).data;
  },
  async getSummary(params?: { startDate?: string; endDate?: string; userId?: string }): Promise<FinancialSummary> {
    const res = await api.get<FinancialSummary>('/financial/summary', { params });
    return res.data;
  },
  async getMonthlySummary(): Promise<{ label: string; income: number }[]> {
    const res = await api.get<{ label: string; income: number }[]>('/financial/monthly-summary');
    return res.data;
  },
  async getRevenueSplit(params?: { startDate?: string; endDate?: string }): Promise<{ totalRevenue: number; studioRevenue: number; prestadorRevenue: number }> {
    const res = await api.get('/financial/revenue-split', { params });
    return res.data;
  },
  async create(data: CreateTransactionData): Promise<Transaction> {
    const res = await api.post<Transaction>('/financial', data);
    return res.data;
  },
  async update(id: string, data: UpdateTransactionData): Promise<Transaction> {
    const res = await api.patch<Transaction>(`/financial/${id}`, data);
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/financial/${id}`);
  },

  async listRecurring(): Promise<RecurringExpense[]> {
    const res = await api.get<RecurringExpense[]>('/financial/recurring');
    return res.data;
  },
  async createRecurring(data: CreateRecurringExpenseData): Promise<RecurringExpense> {
    const res = await api.post<RecurringExpense>('/financial/recurring', data);
    return res.data;
  },
  async updateRecurring(id: string, data: UpdateRecurringExpenseData): Promise<RecurringExpense> {
    const res = await api.patch<RecurringExpense>(`/financial/recurring/${id}`, data);
    return res.data;
  },
  async deleteRecurring(id: string): Promise<void> {
    await api.delete(`/financial/recurring/${id}`);
  },
  async processMonthlyRecurring(): Promise<{ processed: number; created: number }> {
    const res = await api.post('/financial/recurring/process');
    return res.data;
  },
};
