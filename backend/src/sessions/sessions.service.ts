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

    if (serviceType?.name === 'Tatuagem') {
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

    const session = await this.prisma.tattooSession.create({
      data: {
        tenantId,
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
    serviceTypeId?: string,
    size?: TattooSize,
    complexity?: TattooComplexity,
    bodyLocation?: BodyLocation,
  ) {
    const where: any = { tenantId };

    if (serviceTypeId) where.serviceTypeId = serviceTypeId;
    if (size) where.size = size;
    if (complexity) where.complexity = complexity;
    if (bodyLocation) where.bodyLocation = bodyLocation;

    const sessions = await this.prisma.tattooSession.findMany({
      where,
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
    });

    if (sessions.length === 0) {
      return { count: 0, avg: null, min: null, max: null, sessions: [] };
    }

    const prices = sessions.map((s) => s.finalPrice);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return {
      count: sessions.length,
      avg,
      min,
      max,
      sessions: sessions.slice(0, 10),
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
