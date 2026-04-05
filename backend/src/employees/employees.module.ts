import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesPublicController } from './employees-public.controller';
import { EmployeesService } from './employees.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, EmailModule, AuthModule],
  controllers: [EmployeesController, EmployeesPublicController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
