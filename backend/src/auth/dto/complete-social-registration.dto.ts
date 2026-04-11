import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TenantType } from '@prisma/client';

export class CompleteSocialRegistrationDto {
  // TODO: reabilitar STUDIO — @IsEnum(TenantType)
  @IsEnum(['AUTONOMO'])
  @IsNotEmpty()
  tenantType!: TenantType;

  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;
}
