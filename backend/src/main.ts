import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './config/better-auth.config';
import { collectTrustedOriginStrings } from './config/trusted-origins';
import compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = collectTrustedOriginStrings();
  const normalize = (o: string) => o.trim().replace(/\/+$/, '');

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
      if (!origin) {
        callback(null, false);
        return;
      }
      const n = normalize(origin);
      const ok = allowedOrigins.some((a) => normalize(a) === n);
      if (ok) {
        callback(null, origin);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'Origin',
      'Accept',
      'X-Requested-With',
    ],
  });

  // Monta Better Auth em /api/auth (Google OAuth, verificação de email, reset de senha)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all('/api/auth/{*path}', toNodeHandler(auth));

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Gestão Studio API')
      .setDescription(
        'API REST (NestJS). Autenticação: sessão via Better Auth em /api/auth (cookie httpOnly). Rotas /sessions, /financial etc. exigem cookie de sessão válido.',
      )
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Tattoo Hub API rodando na porta ${port}`);
  console.log(`OpenAPI / Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
