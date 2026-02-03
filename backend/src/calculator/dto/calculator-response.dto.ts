export class CostItemDto {
  id!: string;
  name!: string;
  amount!: number;
}

export class QuickReferenceDto {
  '1h'!: number;
  '2h'!: number;
  '3h'!: number;
  '5h'!: number;
}

export class CalculatorResponseDto {
  fixedCosts!: CostItemDto[];
  variableCosts!: CostItemDto[];
  totalFixed!: number;
  totalVariable!: number;
  totalCosts!: number;
  hoursPerMonth!: number;
  profitMargin!: number;
  costPerHour!: number;
  minimumPricePerHour!: number;
  quickReference!: QuickReferenceDto;
}