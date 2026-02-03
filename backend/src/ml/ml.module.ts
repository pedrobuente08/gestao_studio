import { Module } from '@nestjs/common';
import { MlController } from './ml.controller';
import { MlService } from './ml.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [MlController],
  providers: [MlService, AuthGuard, RolesGuard],
  exports: [MlService],
})
export class MlModule {}