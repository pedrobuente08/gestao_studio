import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['EMPLOYEE', 'STAFF'])
  role?: 'EMPLOYEE' | 'STAFF';

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
