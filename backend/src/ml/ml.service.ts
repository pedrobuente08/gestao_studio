import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PredictDto } from './dto/predict.dto';

@Injectable()
export class MlService {
  constructor(private readonly prisma: PrismaService) {}

  async predict(tenantId: string, userId: string, dto: PredictDto) {
    const similarProcedures = await this.prisma.procedure.findMany({
      where: {
        tenantId,
        userId,
        size: dto.size,
        complexity: dto.complexity,
        bodyLocation: dto.bodyLocation,
      },
      select: {
        id: true,
        name: true,
        finalPrice: true,
        duration: true,
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    let predictedPrice = 0;

    if (similarProcedures.length > 0) {
      const total = similarProcedures.reduce(
        (sum, p) => sum + p.finalPrice,
        0,
      );
      predictedPrice = Math.round(total / similarProcedures.length);
    }

    return {
      predictedPrice,
      similarProcedures,
    };
  }
}