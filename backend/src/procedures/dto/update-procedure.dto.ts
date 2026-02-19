import { IsString, IsOptional, IsEnum, IsNumber, IsInt, Min } from 'class-validator';
import { TattooSize, TattooComplexity, BodyLocation } from '@prisma/client';

export class UpdateProcedureDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TattooSize)
  size?: TattooSize;

  @IsOptional()
  @IsEnum(TattooComplexity)
  complexity?: TattooComplexity;

  @IsOptional()
  @IsEnum(BodyLocation)
  bodyLocation?: BodyLocation;

  // Recebe em R$ (ex: 150.00), backend converte para centavos (15000)
  @IsOptional()
  @IsNumber({}, { message: 'Preço deve ser um número' })
  @Min(0)
  finalPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;
}