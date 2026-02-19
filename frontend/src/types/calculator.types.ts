export type CostType = 'fixed' | 'variable';

export interface Cost {
  id: string;
  name: string;
  amount: number;  // em centavos
}

export interface CalculatorResult {
  fixedCosts: Cost[];
  variableCosts: Cost[];
  totalFixedCosts: number;
  totalVariableCosts: number;
  totalCosts: number;
  hoursPerMonth: number;
  profitMargin: number;
  costPerHour: number;
  minimumPricePerHour: number;
  quickReference: { hours: number; minimumPrice: number }[];
}

export interface CreateCostData {
  name: string;
  amount: number;
  type: CostType;
}

export interface WorkSettingsData {
  hoursPerMonth: number;
  profitMargin: number;
}
