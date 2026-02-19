import { IsString, IsOptional, IsEnum, IsNumber, IsInt, Min } from 'class-validator';
import { TattooSize, TattooComplexity, BodyLocation } from '@prisma/client';

export class CreateProcedureDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TattooSize)
  size!: TattooSize;

  @IsEnum(TattooComplexity)
  complexity!: TattooComplexity;

  @IsEnum(BodyLocation)
  bodyLocation!: BodyLocation;

  // Recebe em R$ (ex: 150.00), backend converte para centavos (15000)
  @IsNumber({}, { message: 'Preço deve ser um número' })
  @Min(0)
  finalPrice!: number;

  @IsInt()
  @Min(1)
  duration!: number;
}