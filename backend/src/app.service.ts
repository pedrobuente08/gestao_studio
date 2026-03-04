import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  getStatus() {
    return { status: 'ok', name: 'InkStudio API' };
  }

  // Roda a cada 5 dias para evitar que o Supabase pause o banco por inatividade
  @Cron('0 8 */5 * *')
  async keepDatabaseAlive() {
    await this.prisma.$queryRaw`SELECT 1`;
    this.logger.log('Keep-alive do banco executado.');
  }
}
