import { Body, Controller, Post } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { EmployeesService } from './employees.service';

class FirstAccessDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}

// Controller sem AuthGuard — colaborador ainda não tem sessão ao ativar a conta.
@Controller('employees')
export class EmployeesPublicController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post('first-access')
  firstAccess(@Body() dto: FirstAccessDto) {
    return this.employeesService.firstAccess(dto.token, dto.newPassword);
  }
}
