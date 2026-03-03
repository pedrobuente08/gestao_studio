import api from './api';

export interface MlPredictParams {
  size: string;
  complexity: string;
  bodyLocation: string;
}

export interface MlPredictResult {
  available: boolean;
  predictedPrice?: number;     // centavos
  modelDataPoints?: number;
  trainedAt?: string;
  reason?: string;
  sessionCount?: number;
  minSessionsRequired?: number;
}

export const mlService = {
  async predict(params: MlPredictParams): Promise<MlPredictResult> {
    const res = await api.post<MlPredictResult>('/ml/predict', params);
    return res.data;
  },
};
