import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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

  async create(tenantId: string, dto: CreateSessionDto) {
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

    // Converte finalPrice de R$ para centavos se fornecido
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
}
