import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../../src/config/better-auth.config';

export async function createTestApp(): Promise<INestApplication> {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all('/api/auth/{*path}', toNodeHandler(auth));

  await app.init();
  return app;
}

export async function clearDatabase(prisma: PrismaService): Promise<void> {
  // Ordem respeita FK constraints
  await prisma.mLPrediction.deleteMany();
  await prisma.mLModel.deleteMany();
  await prisma.seedTrainingData.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.tattooSession.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.client.deleteMany();
  await prisma.guestLocation.deleteMany();
  await prisma.fixedCost.deleteMany();
  await prisma.variableCost.deleteMany();
  await prisma.workSettings.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
}
