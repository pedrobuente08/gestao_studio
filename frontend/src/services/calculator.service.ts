import api from './api';
import { CalculatorResult, Cost, CreateCostData, WorkSettingsData } from '@/types/calculator.types';

export const calculatorService = {
  async calculate(): Promise<CalculatorResult> {
    const res = await api.get<CalculatorResult>('/calculator');
    return res.data;
  },
  async addCost(data: CreateCostData, type: 'fixed' | 'variable'): Promise<Cost> {
    const res = await api.post<Cost>(`/calculator/costs`, data, { params: { type } });
    return res.data;
  },
  async updateCost(id: string, data: Partial<CreateCostData>, type: 'fixed' | 'variable'): Promise<Cost> {
    const res = await api.patch<Cost>(`/calculator/costs/${id}`, data, { params: { type } });
    return res.data;
  },
  async removeCost(id: string, type: 'fixed' | 'variable'): Promise<void> {
    await api.delete(`/calculator/costs/${id}`, { params: { type } });
  },
  async setWorkSettings(data: WorkSettingsData): Promise<void> {
    await api.post('/calculator/settings', data);
  },
};
