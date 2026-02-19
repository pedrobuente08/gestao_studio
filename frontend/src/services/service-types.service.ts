import api from './api';
import { ServiceType, CreateServiceTypeData } from '@/types/service-type.types';

export const serviceTypesService = {
  async getAll(): Promise<ServiceType[]> {
    const res = await api.get<ServiceType[]>('/service-types');
    return res.data;
  },
  async create(data: CreateServiceTypeData): Promise<ServiceType> {
    const res = await api.post<ServiceType>('/service-types', data);
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/service-types/${id}`);
  },
};
