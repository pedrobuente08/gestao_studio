import api from './api';
import { Procedure, CreateProcedureData, UpdateProcedureData } from '@/types/procedure.types';

export const proceduresService = {
  async getAll(): Promise<Procedure[]> {
    const res = await api.get<Procedure[]>('/procedures');
    return res.data;
  },
  async getById(id: string): Promise<Procedure> {
    const res = await api.get<Procedure>(`/procedures/${id}`);
    return res.data;
  },
  async create(data: CreateProcedureData): Promise<Procedure> {
    const res = await api.post<Procedure>('/procedures', data);
    return res.data;
  },
  async update(id: string, data: UpdateProcedureData): Promise<Procedure> {
    const res = await api.patch<Procedure>(`/procedures/${id}`, data);
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/procedures/${id}`);
  },
};
