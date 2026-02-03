import { TenantType } from '@prisma/client';

export class TenantResponseDto {
  id!: string;
  type!: TenantType;
  name!: string;
  createdAt!: Date;
  updatedAt!: Date;
}