import { Module } from '@nestjs/common';
import { ProceduresController } from './procedures.controller';
import { ProceduresService } from './procedures.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [ProceduresController],
  providers: [ProceduresService, AuthGuard, RolesGuard],
  exports: [ProceduresService],
})
export class ProceduresModule {}