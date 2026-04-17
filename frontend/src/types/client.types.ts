export type ClientHearingSource =
  | 'INSTAGRAM'
  | 'GOOGLE'
  | 'REFERRAL'
  | 'YOUTUBE'
  | 'OTHER';

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  instagram?: string;
  birthDate?: string;
  hearingSource?: ClientHearingSource | null;
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
  hearingSource?: ClientHearingSource;
  notes?: string;
}

/** `hearingSource: null` no PATCH limpa o campo na base. */
export type UpdateClientData = Partial<Omit<CreateClientData, 'hearingSource'>> & {
  hearingSource?: ClientHearingSource | null;
};
