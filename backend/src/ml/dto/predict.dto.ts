import { IsEnum } from 'class-validator';
import { TattooSize, TattooComplexity, BodyLocation } from '@prisma/client';

export class PredictDto {
  @IsEnum(TattooSize)
  size!: TattooSize;

  @IsEnum(TattooComplexity)
  complexity!: TattooComplexity;

  @IsEnum(BodyLocation)
  bodyLocation!: BodyLocation;
}