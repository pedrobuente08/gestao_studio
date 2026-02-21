import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './config/better-auth.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Monta Better Auth em /api/auth (Google OAuth, verificação de email, reset de senha)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all('/api/auth/{*path}', toNodeHandler(auth));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`InkStudio API rodando na porta ${port}`);
}

bootstrap();
