import { Module } from '@nestjs/common';
import { SeedTrainingController } from './seed-training.controller';
import { SeedTrainingService } from './seed-training.service';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [AuthModule],
  controllers: [SeedTrainingController],
  providers: [SeedTrainingService, RolesGuard],
  exports: [SeedTrainingService],
})
export class SeedTrainingModule {}
