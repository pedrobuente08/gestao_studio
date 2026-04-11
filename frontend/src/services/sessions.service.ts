import api from './api';
import { TattooSession, CreateSessionData, UpdateSessionData } from '@/types/session.types';

export const sessionsService = {
  async getAll(): Promise<TattooSession[]> {
    const res = await api.get<{ data: TattooSession[] } | TattooSession[]>('/sessions');
    // Backend retorna paginado { data: [...] } — extrai o array se necessário
    return Array.isArray(res.data) ? res.data : (res.data as { data: TattooSession[] }).data;
  },
  async getById(id: string): Promise<TattooSession> {
    const res = await api.get<TattooSession>(`/sessions/${id}`);
    return res.data;
  },
  async create(data: CreateSessionData): Promise<TattooSession> {
    const res = await api.post<TattooSession>('/sessions', data);
    return res.data;
  },
  async update(id: string, data: UpdateSessionData): Promise<TattooSession> {
    const res = await api.patch<TattooSession>(`/sessions/${id}`, data);
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/sessions/${id}`);
  },
  async getPriceSuggestion(params: any): Promise<any> {
    const response = await api.get('/sessions/price-suggestion', { params });
    return response.data;
  },
  async getStats(params: any): Promise<any> {
    const response = await api.get('/sessions/stats', { params });
    return response.data;
  },
};
