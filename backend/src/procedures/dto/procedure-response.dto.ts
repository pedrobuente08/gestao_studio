import { TattooSize, TattooComplexity, BodyLocation } from '@prisma/client';

export class ProcedureResponseDto {
  id!: string;
  tenantId!: string;
  userId!: string;
  name!: string;
  description!: string | null;
  size!: TattooSize;
  complexity!: TattooComplexity;
  bodyLocation!: BodyLocation;
  finalPrice!: number;
  duration!: number;
  createdAt!: Date;
  updatedAt!: Date;
  sessionCount!: number;
}