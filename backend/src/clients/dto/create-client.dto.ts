import { IsString, IsOptional, IsEmail, IsDateString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsDateString()
  birthDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}