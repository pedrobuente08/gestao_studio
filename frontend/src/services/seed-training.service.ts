import api from './api';
import {
  SeedTrainingEntry,
  BulkCreateSeedTrainingData,
  BulkCreateResult,
} from '@/types/seed-training.types';

export const seedTrainingService = {
  async getAll(): Promise<SeedTrainingEntry[]> {
    const res = await api.get<SeedTrainingEntry[]>('/seed-training');
    return res.data;
  },

  async bulkCreate(data: BulkCreateSeedTrainingData): Promise<BulkCreateResult> {
    const res = await api.post<BulkCreateResult>('/seed-training/bulk', data);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/seed-training/${id}`);
  },
};
