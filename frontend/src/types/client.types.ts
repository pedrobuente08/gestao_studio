export interface Client {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  instagram?: string;
  birthDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Agregados retornados pela API
  sessionCount?: number;
  totalSpent?: number;   // em centavos
  lastVisit?: string;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  instagram?: string;
  birthDate?: string;
  notes?: string;
}

export type UpdateClientData = Partial<CreateClientData>;
