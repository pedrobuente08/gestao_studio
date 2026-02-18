import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [AuthModule],
  controllers: [TenantsController],
  providers: [TenantsService, RolesGuard],
  exports: [TenantsService],
})
export class TenantsModule {}