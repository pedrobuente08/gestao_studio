export type CostType = 'fixed' | 'variable';
export type CalculatorMode = 'AUTONOMOUS' | 'STUDIO_PERCENTAGE';

export interface Cost {
  id: string;
  name: string;
  amount: number;  // em centavos
}

export interface CalculatorResult {
  fixedCosts: Cost[];
  variableCosts: Cost[];
  totalFixed: number;
  totalVariable: number;
  totalCosts: number;
  hoursPerMonth: number;
  profitMargin: number;
  mode: CalculatorMode;
  studioPercentage: number | null;
  costPerHour: number;
  minimumPricePerHour: number;
  quickReference: Record<string, number>;
}

export interface CreateCostData {
  name: string;
  amount: number;  // em R$
  type: CostType;
}

export interface WorkSettingsData {
  hoursPerMonth: number;
  profitMargin: number;
  mode?: CalculatorMode;
  studioPercentage?: number;
}
