import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('employees')
@UseGuards(AuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles('OWNER', 'STAFF')
  findAll(@CurrentTenant() tenantId: string) {
    return this.employeesService.findAll(tenantId);
  }

  @Post()
  @Roles('OWNER', 'STAFF')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles('OWNER', 'STAFF')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @Roles('OWNER')
  deactivate(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.employeesService.deactivate(id, tenantId);
  }
}
