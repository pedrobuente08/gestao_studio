export interface ServiceType {
  id: string;
  tenantId: string | null;
  name: string;
  isSystem: boolean;
  createdAt: string;
}

export interface CreateServiceTypeData {
  name: string;
}
