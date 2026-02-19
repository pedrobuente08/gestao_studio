import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCostDto {
  @IsString()
  @IsOptional()
  name?: string;

  // Recebe em R$ (ex: 150.00), backend converte para centavos (15000)
  @IsNumber({}, { message: 'Valor deve ser um número' })
  @Min(0)
  @IsOptional()
  amount?: number;
}