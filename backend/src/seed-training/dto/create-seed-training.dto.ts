import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { TattooSize, TattooComplexity, BodyLocation } from '@prisma/client';

export class CreateSeedTrainingDto {
  @IsEnum(TattooSize)
  size!: TattooSize;

  @IsEnum(TattooComplexity)
  complexity!: TattooComplexity;

  @IsEnum(BodyLocation)
  bodyLocation!: BodyLocation;

  @IsInt()
  @IsPositive()
  finalPrice!: number; // em centavos
}
