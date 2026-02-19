import api from './api';
import { Transaction, CreateTransactionData, UpdateTransactionData, FinancialSummary } from '@/types/financial.types';

export const financialService = {
  async getAll(params?: { type?: string; category?: string; startDate?: string; endDate?: string }): Promise<Transaction[]> {
    const res = await api.get<Transaction[]>('/financial', { params });
    return res.data;
  },
  async getSummary(): Promise<FinancialSummary> {
    const res = await api.get<FinancialSummary>('/financial/summary');
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
};
