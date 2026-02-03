export class SimilarProcedureDto {
  id!: string;
  name!: string;
  finalPrice!: number;
  duration!: number;
}

export class PredictionResponseDto {
  predictedPrice!: number;
  similarProcedures!: SimilarProcedureDto[];
}