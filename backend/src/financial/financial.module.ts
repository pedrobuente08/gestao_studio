import { Module } from '@nestjs/common';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [FinancialController],
  providers: [FinancialService, AuthGuard, RolesGuard],
  exports: [FinancialService],
})
export class FinancialModule {}