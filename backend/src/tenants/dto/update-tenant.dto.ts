import { IsOptional, IsString } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;
}