import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, AuthGuard, RolesGuard],
  exports: [TenantsService],
})
export class TenantsModule {}