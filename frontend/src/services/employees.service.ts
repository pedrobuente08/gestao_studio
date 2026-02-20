import api from './api';
import { Employee, CreateEmployeeData, UpdateEmployeeData } from '@/types/employee.types';

export const employeesService = {
  async getAll(): Promise<Employee[]> {
    const response = await api.get<Employee[]>('/employees');
    return response.data;
  },

  async create(data: CreateEmployeeData): Promise<Employee> {
    const response = await api.post<Employee>('/employees', data);
    return response.data;
  },

  async update(id: string, data: UpdateEmployeeData): Promise<Employee> {
    const response = await api.patch<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  async deactivate(id: string): Promise<Employee> {
    const response = await api.delete<Employee>(`/employees/${id}`);
    return response.data;
  },
};
