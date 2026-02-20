import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SeedTrainingService } from './seed-training.service';
import { BulkCreateSeedTrainingDto } from './dto/bulk-create-seed-training.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('seed-training')
@UseGuards(AuthGuard, RolesGuard)
export class SeedTrainingController {
  constructor(private readonly seedTrainingService: SeedTrainingService) {}

  @Get()
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  findAll(@Req() req: any) {
    return this.seedTrainingService.findAll(req.user.id);
  }

  @Get('count')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  getCount(@Req() req: any) {
    return this.seedTrainingService.getCount(req.user.id);
  }

  @Post('bulk')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  bulkCreate(
    @CurrentTenant() tenantId: string,
    @Req() req: any,
    @Body() dto: BulkCreateSeedTrainingDto,
  ) {
    return this.seedTrainingService.bulkCreate(tenantId, req.user.id, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'STAFF', 'EMPLOYEE')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.seedTrainingService.remove(id, req.user.id);
  }
}
