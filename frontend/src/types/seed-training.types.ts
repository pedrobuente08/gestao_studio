import { TattooSize, TattooComplexity, BodyLocation } from './procedure.types';

export interface SeedTrainingEntry {
  id: string;
  userId: string;
  size: TattooSize;
  complexity: TattooComplexity;
  bodyLocation: BodyLocation;
  finalPrice: number; // em centavos
  createdAt: string;
}

export interface CreateSeedTrainingData {
  size: TattooSize;
  complexity: TattooComplexity;
  bodyLocation: BodyLocation;
  finalPrice: number; // em centavos
}

export interface BulkCreateSeedTrainingData {
  entries: CreateSeedTrainingData[];
}

export interface BulkCreateResult {
  created: number;
  total: number;
}

// Linha ainda não salva, acumulada no estado local antes do bulk save
export interface PendingEntry {
  localId: string; // key temporária para o React
  size: TattooSize;
  complexity: TattooComplexity;
  bodyLocation: BodyLocation;
  finalPrice: number; // em R$ (o serviço converte para centavos)
}

export const SEED_MAX = 30;
