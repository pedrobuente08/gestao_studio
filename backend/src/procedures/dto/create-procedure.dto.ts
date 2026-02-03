import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
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

  @IsInt()
  @Min(0)
  finalPrice!: number;

  @IsInt()
  @Min(1)
  duration!: number;
}