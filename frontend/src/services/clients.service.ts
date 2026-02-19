import api from './api';
import { Client, CreateClientData, UpdateClientData } from '@/types/client.types';

export const clientsService = {
  async getAll(): Promise<Client[]> {
    const res = await api.get<Client[]>('/clients');
    return res.data;
  },
  async getById(id: string): Promise<Client> {
    const res = await api.get<Client>(`/clients/${id}`);
    return res.data;
  },
  async create(data: CreateClientData): Promise<Client> {
    const res = await api.post<Client>('/clients', data);
    return res.data;
  },
  async update(id: string, data: UpdateClientData): Promise<Client> {
    const res = await api.patch<Client>(`/clients/${id}`, data);
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};
