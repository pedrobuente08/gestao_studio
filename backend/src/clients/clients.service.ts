import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateClientDto) {
    const client = await this.prisma.client.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
      },
    });

    return {
      ...client,
      totalSessions: 0,
      totalSpent: 0,
      lastVisit: null,
    };
  }

  async findAll(tenantId: string, userId?: string, role?: UserRole) {
    let where: any = { tenantId };

    if (role === UserRole.EMPLOYEE && userId) {
      where = {
        tenantId,
        sessions: {
          some: { userId },
        },
      };
    }

    const clients = await this.prisma.client.findMany({
      where,
      include: {
        sessions: {
          select: {
            id: true,
            finalPrice: true,
            date: true,
          },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clients.map((client) => ({
      id: client.id,
      tenantId: client.tenantId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      notes: client.notes,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      totalSessions: client.sessions.length,
      totalSpent: client.sessions.reduce((sum, s) => sum + s.finalPrice, 0),
      lastVisit: client.sessions.length > 0 ? client.sessions[0].date : null,
    }));
  }

  async findOne(
    id: string,
    tenantId: string,
    userId?: string,
    role?: UserRole,
  ) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        sessions: {
          include: {
            user: { select: { id: true, name: true } },
            procedure: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    if (role === UserRole.EMPLOYEE && userId) {
      const hasSession = client.sessions.some((s) => s.userId === userId);
      if (!hasSession) {
        throw new ForbiddenException(
          'Sem permissão para acessar este cliente',
        );
      }
    }

    return {
      id: client.id,
      tenantId: client.tenantId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      notes: client.notes,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      totalSessions: client.sessions.length,
      totalSpent: client.sessions.reduce((sum, s) => sum + s.finalPrice, 0),
      lastVisit: client.sessions.length > 0 ? client.sessions[0].date : null,
      sessions: client.sessions,
    };
  }

  async update(id: string, tenantId: string, dto: UpdateClientDto) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return this.prisma.client.delete({ where: { id } });
  }
}