import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { TattooSize, TattooComplexity, BodyLocation } from '@prisma/client';

const MIN_SESSIONS_TO_TRAIN = 15;

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private readonly mlServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.mlServiceUrl =
      this.config.get<string>('ML_SERVICE_URL') ?? 'http://localhost:8001';
  }

  // ─── Predição ──────────────────────────────────────────────────────────────

  async predict(
    userId: string,
    size: TattooSize,
    complexity: TattooComplexity,
    bodyLocation: BodyLocation,
  ) {
    const activeModel = await this.prisma.mLModel.findFirst({
      where: { userId, isActive: true },
      orderBy: { trainedAt: 'desc' },
    });

    if (!activeModel) {
      const sessionCount = await this.prisma.tattooSession.count({
        where: { userId, size: { not: null }, complexity: { not: null }, bodyLocation: { not: null } },
      });
      return {
        available: false,
        reason: `Modelo ainda não treinado. Você tem ${sessionCount} de ${MIN_SESSIONS_TO_TRAIN} sessões necessárias.`,
        sessionCount,
        minSessionsRequired: MIN_SESSIONS_TO_TRAIN,
      };
    }

    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.mlServiceUrl}/predict`, {
          userId,
          size,
          complexity,
          bodyLocation,
        }),
      );

      await this.prisma.mLPrediction.create({
        data: {
          userId,
          modelId: activeModel.id,
          size,
          complexity,
          bodyLocation,
          predictedPrice: data.predictedPrice,
        },
      });

      return {
        available: true,
        predictedPrice: data.predictedPrice,
        modelDataPoints: activeModel.dataPointsUsed,
        trainedAt: activeModel.trainedAt,
      };
    } catch (err: any) {
      this.logger.error(`Erro na predição userId=${userId}: ${err.message}`);
      return {
        available: false,
        reason: 'Serviço ML indisponível no momento.',
      };
    }
  }

  // ─── Status do modelo ──────────────────────────────────────────────────────

  async getModelStatus(userId: string) {
    const [model, sessionCount, seedCount] = await Promise.all([
      this.prisma.mLModel.findFirst({
        where: { userId, isActive: true },
        orderBy: { trainedAt: 'desc' },
      }),
      this.prisma.tattooSession.count({
        where: {
          userId,
          size: { not: null },
          complexity: { not: null },
          bodyLocation: { not: null },
        },
      }),
      this.prisma.seedTrainingData.count({ where: { userId } }),
    ]);

    const totalCount = sessionCount + seedCount;

    return {
      hasModel: !!model,
      sessionCount: totalCount,
      minSessionsRequired: MIN_SESSIONS_TO_TRAIN,
      readyToTrain: totalCount >= MIN_SESSIONS_TO_TRAIN,
      ...(model && {
        trainedAt: model.trainedAt,
        dataPointsUsed: model.dataPointsUsed,
      }),
    };
  }

  // ─── Treino ────────────────────────────────────────────────────────────────

  async trainUserModel(
    userId: string,
    tenantId: string,
  ): Promise<{ trained: boolean; reason?: string; dataPointsUsed?: number }> {
    // Combina sessões reais + dados históricos (SeedTrainingData) para o treino
    const [sessions, seedData] = await Promise.all([
      this.prisma.tattooSession.findMany({
        where: {
          tenantId,
          userId,
          size: { not: null },
          complexity: { not: null },
          bodyLocation: { not: null },
        },
        select: { size: true, complexity: true, bodyLocation: true, finalPrice: true },
      }),
      this.prisma.seedTrainingData.findMany({
        where: { tenantId, userId },
        select: { size: true, complexity: true, bodyLocation: true, finalPrice: true },
      }),
    ]);

    const allData = [...sessions, ...seedData];

    if (allData.length < MIN_SESSIONS_TO_TRAIN) {
      return {
        trained: false,
        reason: `Apenas ${allData.length} registros válidos, mínimo é ${MIN_SESSIONS_TO_TRAIN}`,
      };
    }

    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.mlServiceUrl}/train`, { userId, sessions: allData }),
      );

      // Operação atômica: desativa modelo atual e cria novo em uma única transação.
      // Se o create falhar, o updateMany é revertido e o usuário mantém o modelo anterior ativo.
      await this.prisma.$transaction([
        this.prisma.mLModel.deleteMany({ where: { userId, isActive: false } }),
        this.prisma.mLModel.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false },
        }),
        this.prisma.mLModel.create({
          data: {
            userId,
            trainedAt: new Date(),
            dataPointsUsed: data.dataPointsUsed,
            modelPath: data.modelPath,
            isActive: true,
          },
        }),
      ]);

      return { trained: true, dataPointsUsed: data.dataPointsUsed };
    } catch (err: any) {
      this.logger.error(`Erro ao treinar userId=${userId}: ${err.message}`);
      return { trained: false, reason: 'Erro no serviço ML durante o treino.' };
    }
  }

  // ─── Cron: treino semanal (domingo às 3h) ─────────────────────────────────

  @Cron('0 3 * * 0')
  async weeklyTrainingJob() {
    this.logger.log('Iniciando treino semanal dos modelos ML...');

    const users = await this.prisma.user.findMany({
      where: {
        tenantId: { not: null },
        tattooSessions: {
          some: {
            size: { not: null },
            complexity: { not: null },
            bodyLocation: { not: null },
          },
        },
      },
      select: { id: true, tenantId: true },
    });

    let trained = 0;
    let skipped = 0;

    for (const user of users) {
      if (!user.tenantId) continue;
      const result = await this.trainUserModel(user.id, user.tenantId);
      if (result.trained) {
        trained++;
        this.logger.log(`Modelo treinado: userId=${user.id} (${result.dataPointsUsed} sessões)`);
      } else {
        skipped++;
      }
    }

    this.logger.log(
      `Treino semanal concluído: ${trained} treinados, ${skipped} pulados.`,
    );
  }
}
