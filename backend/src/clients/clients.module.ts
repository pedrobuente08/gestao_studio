import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, AuthGuard, RolesGuard],
  exports: [ClientsService],
})
export class ClientsModule {}