import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ServiceTypesService } from './service-types.service';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('service-types')
@UseGuards(AuthGuard, RolesGuard)
export class ServiceTypesController {
  constructor(private readonly serviceTypesService: ServiceTypesService) {}

  @Get()
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  findAll(@CurrentTenant() tenantId: string) {
    return this.serviceTypesService.findAll(tenantId);
  }

  @Post()
  @Roles('OWNER', 'STAFF')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateServiceTypeDto) {
    return this.serviceTypesService.create(tenantId, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'STAFF')
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.serviceTypesService.remove(id, tenantId);
  }
}
