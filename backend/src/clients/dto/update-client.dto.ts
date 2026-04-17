import { IsString, IsOptional, IsEmail, IsDateString, IsEnum } from 'class-validator';
import { ClientHearingSource } from '@prisma/client';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ClientHearingSource)
  hearingSource?: ClientHearingSource | null;
}