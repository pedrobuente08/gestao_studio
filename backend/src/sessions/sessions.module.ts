import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [AuthModule],
  controllers: [SessionsController],
  providers: [SessionsService, RolesGuard],
  exports: [SessionsService],
})
export class SessionsModule {}