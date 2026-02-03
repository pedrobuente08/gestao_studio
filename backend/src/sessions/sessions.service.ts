import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, TransactionType, TransactionCategory } from '@prisma/client';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateSessionDto) {
    let studioFee: number | null = null;
    let tatuadorRevenue: number | null = null;

    if (dto.guestLocationId && dto.studioPercentage !== undefined) {
      studioFee = Math.round((dto.finalPrice * dto.studioPercentage) / 100);
      tatuadorRevenue = dto.finalPrice - studioFee;
    }

    const session = await this.prisma.tattooSession.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        userId: dto.userId,
        procedureId: dto.procedureId,
        size: dto.size,
        complexity: dto.complexity,
        bodyLocation: dto.bodyLocation,
        description: dto.description,
        finalPrice: dto.finalPrice,
        guestLocationId: dto.guestLocationId,
        studioPercentage: dto.studioPercentage,
        studioFee,
        tatuadorRevenue,
        duration: dto.duration,
        date: new Date(dto.date),
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        user: {
          select: { id: true, name: true },
        },
        procedure: {
          select: { id: true, name: true },
        },
        guestLocation: {
          select: { id: true, name: true },
        },
      },
    });

    await this.prisma.transaction.create({
      data: {
        tenantId,
        type: TransactionType.INCOME,
        category: TransactionCategory.TATTOO,
        amount: dto.finalPrice,
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

    const sessions = await this.prisma.tattooSession.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        user: {
          select: { id: true, name: true },
        },
        procedure: {
          select: { id: true, name: true },
        },
        guestLocation: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return sessions;
  }

  async findOne(
    id: string,
    tenantId: string,
    userId?: string,
    role?: UserRole,
  ) {
    const session = await this.prisma.tattooSession.findFirst({
      where: { id, tenantId },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        user: {
          select: { id: true, name: true },
        },
        procedure: {
          select: { id: true, name: true },
        },
        guestLocation: {
          select: { id: true, name: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (role === UserRole.EMPLOYEE && userId && session.userId !== userId) {
      throw new ForbiddenException('Sem permissão para acessar esta sessão');
    }

    return session;
  }

  async update(id: string, tenantId: string, dto: UpdateSessionDto) {
    const session = await this.prisma.tattooSession.findFirst({
      where: { id, tenantId },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    const finalPrice = dto.finalPrice ?? session.finalPrice;
    const studioPercentage = dto.studioPercentage ?? session.studioPercentage;
    const guestLocationId = dto.guestLocationId ?? session.guestLocationId;

    let studioFee: number | null = session.studioFee;
    let tatuadorRevenue: number | null = session.tatuadorRevenue;

    if (guestLocationId && studioPercentage !== null) {
      studioFee = Math.round((finalPrice * studioPercentage) / 100);
      tatuadorRevenue = finalPrice - studioFee;
    }

    const updatedSession = await this.prisma.tattooSession.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
        studioFee,
        tatuadorRevenue,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        user: {
          select: { id: true, name: true },
        },
        procedure: {
          select: { id: true, name: true },
        },
        guestLocation: {
          select: { id: true, name: true },
        },
      },
    });

    if (dto.finalPrice !== undefined || dto.date !== undefined) {
      await this.prisma.transaction.updateMany({
        where: { sessionId: id },
        data: {
          amount: dto.finalPrice,
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
      throw new NotFoundException('Sessão não encontrada');
    }

    await this.prisma.transaction.deleteMany({
      where: { sessionId: id },
    });

    return this.prisma.tattooSession.delete({ where: { id } });
  }
}