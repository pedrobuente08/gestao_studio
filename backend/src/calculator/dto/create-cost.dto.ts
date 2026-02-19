import { IsIn, IsNumber, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateCostDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  // Recebe em R$ (ex: 150.00), backend converte para centavos (15000)
  @IsNumber({}, { message: 'Valor deve ser um número' })
  @Min(0)
  amount!: number;

  @IsIn(['fixed', 'variable'])
  type!: 'fixed' | 'variable';
}