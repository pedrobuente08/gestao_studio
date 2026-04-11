import api from './api';
import type { MlPredictResult } from './ml.service';

export interface PriceSuggestionParams {
  serviceTypeId?: string;
  size?: string;
  complexity?: string;
  bodyLocation?: string;
}

export interface PriceSuggestionSession {
  id: string;
  finalPrice: number;
  date: string;
  description?: string;
  client?: { name: string };
  serviceType?: { name: string };
}

export interface PriceSuggestionResult {
  count: number;
  avg: number | null;
  min: number | null;
  max: number | null;
  sessions: PriceSuggestionSession[];
  seedCount?: number;
  confidence?: 'high' | 'medium' | 'low';
  /** Presente quando tamanho, complexidade e local foram enviados — resultado do modelo CatBoost. */
  ml?: MlPredictResult;
}

export const priceSuggestionService = {
  async getSuggestion(params: PriceSuggestionParams): Promise<PriceSuggestionResult> {
    const res = await api.get<PriceSuggestionResult>('/sessions/price-suggestion', { params });
    return res.data;
  },
};
