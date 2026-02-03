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

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  procedureId?: string;

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

  @IsOptional()
  @IsInt()
  @Min(0)
  finalPrice?: number;

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

  @IsOptional()
  @IsDateString()
  date?: string;
}