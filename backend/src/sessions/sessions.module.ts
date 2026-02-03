import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, AuthGuard, RolesGuard],
  exports: [SessionsService],
})
export class SessionsModule {}