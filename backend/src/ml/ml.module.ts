import { Module } from '@nestjs/common';
import { MlController } from './ml.controller';
import { MlService } from './ml.service';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [AuthModule],
  controllers: [MlController],
  providers: [MlService, RolesGuard],
  exports: [MlService],
})
export class MlModule {}