import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';
import { FinancialService } from './financial/financial.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financialService: FinancialService,
  ) {}

  getStatus() {
    return { status: 'ok', name: 'InkStudio API' };
  }

  // Roda a cada 5 dias para evitar que o Supabase pause o banco por inatividade
  @Cron('0 8 */5 * *')
  async keepDatabaseAlive() {
    await this.prisma.$queryRaw`SELECT 1`;
    this.logger.log('Keep-alive do banco executado.');
  }

  // Roda todo domingo às 4h — limpa registros expirados/obsoletos do banco
  @Cron('0 4 * * 0')
  async cleanupDatabase() {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const [predictions, sessions, verifications] = await Promise.all([
      this.prisma.mLPrediction.deleteMany({ where: { createdAt: { lt: sixtyDaysAgo } } }),
      this.prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.verification.deleteMany({ where: { expiresAt: { lt: now } } }),
    ]);

    this.logger.log(
      `Limpeza semanal: ${predictions.count} predições ML, ${sessions.count} sessões auth, ${verifications.count} verificações removidas.`,
    );
  }

  // Roda todo dia 1 às 6h — lança transações dos gastos recorrentes de cada tenant
  @Cron('0 6 1 * *')
  async processAllRecurringExpenses() {
    this.logger.log('Iniciando lançamento de gastos recorrentes...');
    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });
    let total = 0;
    for (const tenant of tenants) {
      const result = await this.financialService.processMonthlyRecurring(tenant.id);
      total += result.created;
    }
    this.logger.log(`Gastos recorrentes lançados: ${total} transações criadas.`);
  }
}
