import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
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

  @IsOptional()
  @IsInt()
  @Min(0)
  finalPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;
}