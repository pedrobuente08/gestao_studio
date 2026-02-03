import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TenantType } from '@prisma/client';

export class CreateTenantDto {
  @IsEnum(TenantType)
  @IsNotEmpty()
  type!: TenantType;

  @IsString()
  @IsNotEmpty()
  name!: string;
}