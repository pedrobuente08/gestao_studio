import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { TenantType } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(TenantType)
  @IsNotEmpty()
  tenantType!: TenantType;

  @IsString()
  @IsNotEmpty()
  tenantName!: string;
}