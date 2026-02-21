import api from './api';

export interface Tenant {
  id: string;
  name: string;
  type: 'STUDIO' | 'INDEPENDENT';
  slug: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudioConfig {
  id: string;
  tenantId: string;
  defaultPercentage: number;
}

export const tenantsService = {
  getMe: async () => {
    const response = await api.get<Tenant>('/tenants/me');
    return response.data;
  },

  updateMe: async (data: Partial<Pick<Tenant, 'name' | 'logoUrl'>>) => {
    const response = await api.patch<Tenant>('/tenants/me', data);
    return response.data;
  },

  getStudioConfig: async () => {
    const response = await api.get<StudioConfig>('/tenants/studio-config');
    return response.data;
  },

  updateStudioConfig: async (defaultPercentage: number) => {
    const response = await api.patch<StudioConfig>('/tenants/studio-config', { defaultPercentage });
    return response.data;
  },
};
