import { TattooSize, TattooComplexity, BodyLocation } from '@prisma/client';

export class SessionClientDto {
  id!: string;
  name!: string;
  email!: string | null;
  phone!: string | null;
}

export class SessionUserDto {
  id!: string;
  name!: string;
}

export class SessionProcedureDto {
  id!: string;
  name!: string;
}

export class SessionGuestLocationDto {
  id!: string;
  name!: string;
}

export class SessionResponseDto {
  id!: string;
  tenantId!: string;
  clientId!: string;
  userId!: string;
  procedureId!: string | null;
  size!: TattooSize;
  complexity!: TattooComplexity;
  bodyLocation!: BodyLocation;
  description!: string | null;
  finalPrice!: number;
  guestLocationId!: string | null;
  studioPercentage!: number | null;
  studioFee!: number | null;
  tatuadorRevenue!: number | null;
  duration!: number | null;
  date!: Date;
  createdAt!: Date;
  updatedAt!: Date;
  client!: SessionClientDto;
  user!: SessionUserDto;
  procedure!: SessionProcedureDto | null;
  guestLocation!: SessionGuestLocationDto | null;
}