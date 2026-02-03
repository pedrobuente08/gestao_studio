import {
  IsString,
  IsOptional,
  IsEnum,
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

  @IsEnum(TattooSize)
  size!: TattooSize;

  @IsEnum(TattooComplexity)
  complexity!: TattooComplexity;

  @IsEnum(BodyLocation)
  bodyLocation!: BodyLocation;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
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