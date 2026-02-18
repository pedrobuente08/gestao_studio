import { Module } from '@nestjs/common';
import { CalculatorController } from './calculator.controller';
import { CalculatorService } from './calculator.service';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [AuthModule],
  controllers: [CalculatorController],
  providers: [CalculatorService, RolesGuard],
  exports: [CalculatorService],
})
export class CalculatorModule {}