import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('tenants')
@UseGuards(AuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  findOne(@CurrentTenant() tenantId: string) {
    return this.tenantsService.findOne(tenantId);
  }

  @Patch('me')
  @Roles('OWNER')
  update(@CurrentTenant() tenantId: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(tenantId, dto);
  }

  @Get('studio-config')
  @Roles('OWNER', 'STAFF')
  getStudioConfig(@CurrentTenant() tenantId: string) {
    return this.tenantsService.getStudioConfig(tenantId);
  }

  @Patch('studio-config')
  @Roles('OWNER')
  updateStudioConfig(
    @CurrentTenant() tenantId: string,
    @Body('defaultPercentage') defaultPercentage: number,
  ) {
    return this.tenantsService.updateStudioConfig(tenantId, defaultPercentage);
  }

  @Post('benefits')
  @Roles('OWNER')
  addTatuadorBenefit(
    @CurrentTenant() tenantId: string,
    @Body() body: { userId: string; percentage: number; reason?: string },
  ) {
    return this.tenantsService.addTatuadorBenefit(
      tenantId,
      body.userId,
      body.percentage,
      body.reason,
    );
  }

  @Delete('benefits/:id')
  @Roles('OWNER')
  removeTatuadorBenefit(@Param('id') id: string) {
    return this.tenantsService.removeTatuadorBenefit(id);
  }
}