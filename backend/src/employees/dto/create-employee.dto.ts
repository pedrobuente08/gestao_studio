import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsEnum(['EMPLOYEE', 'STAFF'])
  role!: 'EMPLOYEE' | 'STAFF';

  @IsString()
  serviceTypeId!: string;
}
