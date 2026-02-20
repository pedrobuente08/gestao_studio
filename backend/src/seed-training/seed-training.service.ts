import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulkCreateSeedTrainingDto } from './dto/bulk-create-seed-training.dto';

const MAX_SEED_ENTRIES = 30;

@Injectable()
export class SeedTrainingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.seedTrainingData.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async bulkCreate(tenantId: string, userId: string, dto: BulkCreateSeedTrainingDto) {
    const existingCount = await this.prisma.seedTrainingData.count({ where: { userId } });

    if (existingCount + dto.entries.length > MAX_SEED_ENTRIES) {
      throw new BadRequestException(
        `Limite de ${MAX_SEED_ENTRIES} entradas históricas atingido. Você já tem ${existingCount} e está tentando adicionar ${dto.entries.length}.`,
      );
    }

    const data = dto.entries.map((entry) => ({
      tenantId,
      userId,
      size: entry.size,
      complexity: entry.complexity,
      bodyLocation: entry.bodyLocation,
      finalPrice: entry.finalPrice,
    }));

    await this.prisma.seedTrainingData.createMany({ data });

    return { created: dto.entries.length, total: existingCount + dto.entries.length };
  }

  async remove(id: string, userId: string) {
    const entry = await this.prisma.seedTrainingData.findFirst({ where: { id, userId } });
    if (!entry) throw new BadRequestException('Entrada não encontrada');
    return this.prisma.seedTrainingData.delete({ where: { id } });
  }

  async getCount(userId: string): Promise<number> {
    return this.prisma.seedTrainingData.count({ where: { userId } });
  }
}
