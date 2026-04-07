import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { ClientsModule } from './clients/clients.module';
import { ProceduresModule } from './procedures/procedures.module';
import { SessionsModule } from './sessions/sessions.module';
import { FinancialModule } from './financial/financial.module';
import { CalculatorModule } from './calculator/calculator.module';
import { MlModule } from './ml/ml.module';
import { ServiceTypesModule } from './service-types/service-types.module';
import { EmployeesModule } from './employees/employees.module';
import { StorageModule } from './storage/storage.module';
import { SeedTrainingModule } from './seed-training/seed-training.module';
import { envConfig } from './config/env.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1_000, limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 100 },
    ]),
    PrismaModule,
    AuthModule,
    TenantsModule,
    ClientsModule,
    ProceduresModule,
    SessionsModule,
    FinancialModule,
    CalculatorModule,
    MlModule,
    ServiceTypesModule,
    EmployeesModule,
    StorageModule,
    SeedTrainingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}