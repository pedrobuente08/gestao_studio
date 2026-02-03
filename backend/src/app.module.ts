import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { ClientsModule } from './clients/clients.module';
import { ProceduresModule } from './procedures/procedures.module';
import { SessionsModule } from './sessions/sessions.module';
import { FinancialModule } from './financial/financial.module';
import { CalculatorModule } from './calculator/calculator.module';
import { MlModule } from './ml/ml.module';
import { envConfig } from './config/env.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig),
    PrismaModule,
    AuthModule,
    TenantsModule,
    ClientsModule,
    ProceduresModule,
    SessionsModule,
    FinancialModule,
    CalculatorModule,
    MlModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}