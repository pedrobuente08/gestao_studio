import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  Min,
  IsDateString,
  Max,
} from 'class-validator';
import { TattooSize, TattooComplexity, BodyLocation } from '@prisma/client';

export class CreateSessionDto {
  @IsString()
  clientId!: string;

  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  procedureId?: string;

  @IsOptional()
  @IsString()
  serviceTypeId?: string;

  @IsOptional()
  @IsEnum(TattooSize)
  size?: TattooSize;

  @IsOptional()
  @IsEnum(TattooComplexity)
  complexity?: TattooComplexity;

  @IsOptional()
  @IsEnum(BodyLocation)
  bodyLocation?: BodyLocation;

  @IsOptional()
  @IsString()
  description?: string;

  // Recebe em R$ (ex: 150.00), backend converte para centavos (15000)
  @IsNumber({}, { message: 'Preço deve ser um número' })
  @Min(0)
  finalPrice!: number;

  @IsOptional()
  @IsString()
  guestLocationId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  studioPercentage?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsDateString()
  date!: string;
}
