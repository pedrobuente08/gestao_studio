import { PrismaClient } from '@prisma/client';

// Instância global do Prisma usada fora do contexto NestJS (ex: better-auth.config.ts)
export const prisma = new PrismaClient();
