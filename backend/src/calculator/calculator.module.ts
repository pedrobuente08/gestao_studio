import { Module } from '@nestjs/common';
import { CalculatorController } from './calculator.controller';
import { CalculatorService } from './calculator.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [CalculatorController],
  providers: [CalculatorService, AuthGuard, RolesGuard],
  exports: [CalculatorService],
})
export class CalculatorModule {}