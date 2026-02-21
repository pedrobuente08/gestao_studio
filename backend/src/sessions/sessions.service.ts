import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UserRole,
  TransactionType,
  TransactionCategory,
  TattooSize,
  TattooComplexity,
  BodyLocation,
} from '@prisma/client';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

const SESSION_INCLUDES = {
  client: { select: { id: true, name: true, email: true, phone: true } },
  user: { select: { id: true, name: true } },
  procedure: { select: { id: true, name: true } },
  serviceType: { select: { id: true, name: true } },
  guestLocation: { select: { id: true, name: true } },
};

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateTattooFields(dto: CreateSessionDto | UpdateSessionDto) {
    if (!dto.serviceTypeId) return;

    const serviceType = await this.prisma.serviceType.findUnique({
      where: { id: dto.serviceTypeId },
    });

    const isTattoo = serviceType?.name === 'Tatuagem' || serviceType?.name === 'TATUAGEM';

    if (isTattoo) {
      if (!dto.size || !dto.complexity || !dto.bodyLocation) {
        throw new BadRequestException(
          'Campos tamanho, complexidade e local do corpo são obrigatórios para o tipo Tatuagem',
        );
      }
    }
  }

  async create(tenantId: string, dto: CreateSessionDto) {
    await this.validateTattooFields(dto);

    // Converte de R$ para centavos
    const finalPriceCents = Math.round(dto.finalPrice * 100);

    let studioFee: number | null = null;
    let tatuadorRevenue: number | null = null;

    if (dto.guestLocationId && dto.studioPercentage !== undefined) {
      studioFee = Math.round((finalPriceCents * dto.studioPercentage) / 100);
      tatuadorRevenue = finalPriceCents - studioFee;
    }

    // Se userId não for fornecido, tenta usar um padrão ou lança erro (embora o DTO exija)
    const userId = dto.userId;
    if (!userId) {
      throw new BadRequestException('ID do usuário/profissional é obrigatório');
    }

    const session = await this.prisma.tattooSession.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        userId: userId,
        procedureId: dto.procedureId,
        serviceTypeId: dto.serviceTypeId,
        size: dto.size,
        complexity: dto.complexity,
        bodyLocation: dto.bodyLocation,
        description: dto.description,
        finalPrice: finalPriceCents,
        guestLocationId: dto.guestLocationId,
        studioPercentage: dto.studioPercentage,
        studioFee,
        tatuadorRevenue,
        duration: dto.duration,
        date: new Date(dto.date),
      },
      include: SESSION_INCLUDES,
    });

    await this.prisma.transaction.create({
      data: {
        tenantId,
        type: TransactionType.INCOME,
        category: TransactionCategory.TATTOO,
        amount: finalPriceCents,
        clientId: dto.clientId,
        sessionId: session.id,
        date: new Date(dto.date),
      },
    });

    return session;
  }

  async findAll(tenantId: string, userId?: string, role?: UserRole) {
    let where: any = { tenantId };

    if (role === UserRole.EMPLOYEE && userId) {
      where.userId = userId;
    }

    return this.prisma.tattooSession.findMany({
      where,
      include: SESSION_INCLUDES,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(
    id: string,
    tenantId: string,
    userId?: string,
    role?: UserRole,
  ) {
    const session = await this.prisma.tattooSession.findFirst({
      where: { id, tenantId },
      include: SESSION_INCLUDES,
    });

    if (!session) {
      throw new NotFoundException('Procedimento não encontrado');
    }

    if (role === UserRole.EMPLOYEE && userId && session.userId !== userId) {
      throw new ForbiddenException('Sem permissão para acessar este procedimento');
    }

    return session;
  }

  async update(id: string, tenantId: string, dto: UpdateSessionDto) {
    const session = await this.prisma.tattooSession.findFirst({
      where: { id, tenantId },
    });

    if (!session) {
      throw new NotFoundException('Procedimento não encontrado');
    }

    await this.validateTattooFields(dto);

    // Converte finalPrice de R$ para centavos de fornecido
    const finalPriceCents =
      dto.finalPrice !== undefined
        ? Math.round(dto.finalPrice * 100)
        : session.finalPrice;

    const studioPercentage = dto.studioPercentage ?? session.studioPercentage;
    const guestLocationId = dto.guestLocationId ?? session.guestLocationId;

    let studioFee: number | null = session.studioFee;
    let tatuadorRevenue: number | null = session.tatuadorRevenue;

    if (guestLocationId && studioPercentage !== null) {
      studioFee = Math.round((finalPriceCents * studioPercentage) / 100);
      tatuadorRevenue = finalPriceCents - studioFee;
    }

    const updatedSession = await this.prisma.tattooSession.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        userId: dto.userId,
        procedureId: dto.procedureId,
        serviceTypeId: dto.serviceTypeId,
        size: dto.size,
        complexity: dto.complexity,
        bodyLocation: dto.bodyLocation,
        description: dto.description,
        finalPrice: finalPriceCents,
        guestLocationId: dto.guestLocationId,
        studioPercentage: dto.studioPercentage,
        studioFee,
        tatuadorRevenue,
        duration: dto.duration,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: SESSION_INCLUDES,
    });

    if (dto.finalPrice !== undefined || dto.date !== undefined) {
      await this.prisma.transaction.updateMany({
        where: { sessionId: id },
        data: {
          amount: finalPriceCents,
          date: dto.date ? new Date(dto.date) : undefined,
        },
      });
    }

    return updatedSession;
  }

  async remove(id: string, tenantId: string) {
    const session = await this.prisma.tattooSession.findFirst({
      where: { id, tenantId },
    });

    if (!session) {
      throw new NotFoundException('Procedimento não encontrado');
    }

    await this.prisma.transaction.deleteMany({ where: { sessionId: id } });

    return this.prisma.tattooSession.delete({ where: { id } });
  }

  async getPriceSuggestion(
    tenantId: string,
    userId: string,
    serviceTypeId?: string,
    size?: TattooSize,
    complexity?: TattooComplexity,
    bodyLocation?: BodyLocation,
  ) {
    const useTattooKnn = size || complexity || bodyLocation;

    if (useTattooKnn) {
      return this.getPriceSuggestionKnn(userId, tenantId, size, complexity, bodyLocation);
    }

    // Modo simples: sem parâmetros de tatuagem — filtra só por serviceType
    const sessionWhere: any = { tenantId, userId };
    if (serviceTypeId) sessionWhere.serviceTypeId = serviceTypeId;

    const [realSessions, seedEntries] = await Promise.all([
      this.prisma.tattooSession.findMany({
        where: sessionWhere,
        select: {
          id: true,
          finalPrice: true,
          date: true,
          description: true,
          client: { select: { name: true } },
          serviceType: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      this.prisma.seedTrainingData.findMany({
        where: { userId },
        select: { id: true, finalPrice: true },
      }),
    ]);

    const allPrices: number[] = [
      ...realSessions.map((s: { finalPrice: number }) => s.finalPrice),
      ...seedEntries.map((s: { finalPrice: number }) => s.finalPrice),
    ];

    if (allPrices.length === 0) {
      return { count: 0, avg: null, min: null, max: null, sessions: [], seedCount: 0 };
    }

    const avg = Math.round(allPrices.reduce((a: number, b: number) => a + b, 0) / allPrices.length);
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);

    return {
      count: allPrices.length,
      avg,
      min,
      max,
      sessions: realSessions.slice(0, 10),
      seedCount: seedEntries.length,
    };
  }

  private async getPriceSuggestionKnn(
    userId: string,
    tenantId: string,
    size?: TattooSize,
    complexity?: TattooComplexity,
    bodyLocation?: BodyLocation,
  ) {
    const K = 15; // vizinhos candidatos — IDW faz o peso, mais candidatos = mais cobertura

    const [sizeScales, complexityScales, locationScales, allSeed, allSessions] = await Promise.all([
      this.prisma.tattooSizeScale.findMany(),
      this.prisma.tattooComplexityScale.findMany(),
      this.prisma.bodyLocationScale.findMany(),
      this.prisma.seedTrainingData.findMany({
        where: { userId },
        select: { finalPrice: true, size: true, complexity: true, bodyLocation: true },
      }),
      this.prisma.tattooSession.findMany({
        where: {
          tenantId,
          userId,
          size: { not: null },
          complexity: { not: null },
          bodyLocation: { not: null },
        },
        select: {
          id: true,
          finalPrice: true,
          date: true,
          description: true,
          size: true,
          complexity: true,
          bodyLocation: true,
          client: { select: { name: true } },
          serviceType: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    const sizeLevel = Object.fromEntries(sizeScales.map((s) => [s.size, s.level]));
    const complexityLevel = Object.fromEntries(complexityScales.map((s) => [s.complexity, s.level]));
    const locationLevel = Object.fromEntries(locationScales.map((s) => [s.bodyLocation, s.level]));

    // Normalização para [0, 1] — ranges: size 1-6, complexity 1-4, location 1-3
    const norm = (v: number, min: number, max: number) =>
      max === min ? 0 : (v - min) / (max - min);

    const queryVec = [
      norm(size ? (sizeLevel[size] ?? 1) : 3, 1, 6),
      norm(complexity ? (complexityLevel[complexity] ?? 1) : 2, 1, 4),
      norm(bodyLocation ? (locationLevel[bodyLocation] ?? 1) : 2, 1, 3),
    ];

    const calcDist = (v: number[]) =>
      Math.sqrt(queryVec.reduce((sum, qi, i) => sum + (qi - v[i]) ** 2, 0));

    type Candidate = { finalPrice: number; dist: number };
    const candidates: Candidate[] = [];

    for (const e of allSeed) {
      if (!e.size || !e.complexity || !e.bodyLocation) continue;
      const vec = [
        norm(sizeLevel[e.size] ?? 1, 1, 6),
        norm(complexityLevel[e.complexity] ?? 1, 1, 4),
        norm(locationLevel[e.bodyLocation] ?? 1, 1, 3),
      ];
      candidates.push({ finalPrice: e.finalPrice, dist: calcDist(vec) });
    }

    const sessionCandidates: { dist: number; session: (typeof allSessions)[number] }[] = [];
    for (const s of allSessions) {
      if (!s.size || !s.complexity || !s.bodyLocation) continue;
      const vec = [
        norm(sizeLevel[s.size] ?? 1, 1, 6),
        norm(complexityLevel[s.complexity] ?? 1, 1, 4),
        norm(locationLevel[s.bodyLocation] ?? 1, 1, 3),
      ];
      const dist = calcDist(vec);
      candidates.push({ finalPrice: s.finalPrice, dist });
      sessionCandidates.push({ dist, session: s });
    }

    if (candidates.length === 0) {
      return { count: 0, avg: null, min: null, max: null, sessions: [], seedCount: 0, confidence: 'low' };
    }

    candidates.sort((a, b) => a.dist - b.dist);
    const kNearest = candidates.slice(0, K);

    // ── Inverse Distance Weighting (IDW) ─────────────────────────────────────
    // Se existir match perfeito (dist=0), usa apenas eles — sem distorção
    const EPS = 0.0001;
    const perfectMatches = kNearest.filter((c) => c.dist < EPS);

    let weightedAvg: number;
    if (perfectMatches.length > 0) {
      weightedAvg = Math.round(
        perfectMatches.reduce((s, c) => s + c.finalPrice, 0) / perfectMatches.length,
      );
    } else {
      const totalWeight = kNearest.reduce((s, c) => s + 1 / (c.dist ** 2 + EPS), 0);
      weightedAvg = Math.round(
        kNearest.reduce((s, c) => s + c.finalPrice / (c.dist ** 2 + EPS), 0) / totalWeight,
      );
    }

    const prices = kNearest.map((c) => c.finalPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // Confiança: baseada na distância média dos K vizinhos
    const avgDist = kNearest.reduce((s, c) => s + c.dist, 0) / kNearest.length;
    const confidence = avgDist < 0.3 ? 'high' : avgDist < 0.6 ? 'medium' : 'low';

    sessionCandidates.sort((a, b) => a.dist - b.dist);
    const referenceSessions = sessionCandidates.slice(0, 5).map((c) => c.session);
    const seedCount = kNearest.length - referenceSessions.length;

    return {
      count: kNearest.length,
      avg: weightedAvg,
      min,
      max,
      sessions: referenceSessions,
      seedCount: seedCount > 0 ? seedCount : 0,
      confidence,
    };
  }

  async getStats(
    tenantId: string,
    filters: {
      serviceTypeId?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = { tenantId };

    if (filters.serviceTypeId) where.serviceTypeId = filters.serviceTypeId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate)
        where.date.lte = new Date(filters.endDate + 'T23:59:59');
    }

    const [aggregate, sessions] = await Promise.all([
      this.prisma.tattooSession.aggregate({
        where,
        _sum: { finalPrice: true },
        _count: { id: true },
        _avg: { finalPrice: true },
      }),
      this.prisma.tattooSession.findMany({
        where,
        include: {
          serviceType: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Agrupar por tipo de serviço
    const byServiceTypeMap = new Map<
      string,
      { serviceTypeId: string; name: string; count: number; revenue: number }
    >();
    const byEmployeeMap = new Map<
      string,
      { userId: string; name: string; count: number; revenue: number }
    >();

    for (const s of sessions) {
      if (s.serviceType) {
        const key = s.serviceType.id;
        const existing = byServiceTypeMap.get(key) ?? {
          serviceTypeId: key,
          name: s.serviceType.name,
          count: 0,
          revenue: 0,
        };
        existing.count++;
        existing.revenue += s.finalPrice;
        byServiceTypeMap.set(key, existing);
      }
      if (s.user) {
        const key = s.user.id;
        const existing = byEmployeeMap.get(key) ?? {
          userId: key,
          name: s.user.name,
          count: 0,
          revenue: 0,
        };
        existing.count++;
        existing.revenue += s.finalPrice;
        byEmployeeMap.set(key, existing);
      }
    }

    return {
      totalRevenue: aggregate._sum.finalPrice ?? 0,
      sessionCount: aggregate._count.id,
      avgTicket: Math.round(aggregate._avg.finalPrice ?? 0),
      byServiceType: Array.from(byServiceTypeMap.values()),
      byEmployee: Array.from(byEmployeeMap.values()),
    };
  }
}
