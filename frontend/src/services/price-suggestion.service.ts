import api from './api';

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
}

export const priceSuggestionService = {
  async getSuggestion(params: PriceSuggestionParams): Promise<PriceSuggestionResult> {
    const res = await api.get<PriceSuggestionResult>('/sessions/price-suggestion', { params });
    return res.data;
  },
};
