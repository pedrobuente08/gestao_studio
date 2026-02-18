import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [AuthModule],
  controllers: [ClientsController],
  providers: [ClientsService, RolesGuard],
  exports: [ClientsService],
})
export class ClientsModule {}