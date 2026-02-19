import { TattooSize, TattooComplexity, BodyLocation } from './procedure.types';

export interface TattooSession {
  id: string;
  tenantId: string;
  clientId: string;
  userId: string;
  procedureId?: string;
  size: TattooSize;
  complexity: TattooComplexity;
  bodyLocation: BodyLocation;
  description?: string;
  finalPrice: number;        // em centavos
  guestLocationId?: string;
  studioPercentage?: number;
  studioFee?: number;        // em centavos
  tatuadorRevenue?: number;  // em centavos
  duration?: number;         // em minutos
  date: string;
  createdAt: string;
  updatedAt: string;
  // Relações incluídas
  client?: { id: string; name: string };
  user?: { id: string; name: string };
  procedure?: { id: string; name: string };
}

export interface CreateSessionData {
  clientId: string;
  userId: string;
  procedureId?: string;
  size: TattooSize;
  complexity: TattooComplexity;
  bodyLocation: BodyLocation;
  description?: string;
  finalPrice: number;
  guestLocationId?: string;
  studioPercentage?: number;
  duration?: number;
  date: string;
}

export type UpdateSessionData = Partial<CreateSessionData>;
