import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { AuthModule } from '../auth/auth.module';
import { MlModule } from '../ml/ml.module';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [AuthModule, MlModule],
  controllers: [SessionsController],
  providers: [SessionsService, RolesGuard],
  exports: [SessionsService],
})
export class SessionsModule {}