import { Module } from '@nestjs/common';
import { ProceduresController } from './procedures.controller';
import { ProceduresService } from './procedures.service';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [AuthModule],
  controllers: [ProceduresController],
  providers: [ProceduresService, RolesGuard],
  exports: [ProceduresService],
})
export class ProceduresModule {}