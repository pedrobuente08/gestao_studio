import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';

@Injectable()
export class ProceduresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateProcedureDto) {
    const procedure = await this.prisma.procedure.create({
      data: {
        tenantId,
        userId,
        name: dto.name,
        description: dto.description,
        size: dto.size,
        complexity: dto.complexity,
        bodyLocation: dto.bodyLocation,
        finalPrice: Math.round(dto.finalPrice * 100), // Converte de R$ para centavos
        duration: dto.duration,
      },
    });

    return {
      ...procedure,
      sessionCount: 0,
    };
  }

  async findAll(tenantId: string, userId?: string, role?: UserRole) {
    let where: any = { tenantId };

    if (role === UserRole.EMPLOYEE && userId) {
      where.userId = userId;
    }

    const procedures = await this.prisma.procedure.findMany({
      where,
      include: {
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return procedures.map((procedure) => ({
      id: procedure.id,
      tenantId: procedure.tenantId,
      userId: procedure.userId,
      name: procedure.name,
      description: procedure.description,
      size: procedure.size,
      complexity: procedure.complexity,
      bodyLocation: procedure.bodyLocation,
      finalPrice: procedure.finalPrice,
      duration: procedure.duration,
      createdAt: procedure.createdAt,
      updatedAt: procedure.updatedAt,
      sessionCount: procedure._count.sessions,
    }));
  }

  async findOne(id: string, tenantId: string) {
    const procedure = await this.prisma.procedure.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!procedure) {
      throw new NotFoundException('Procedimento não encontrado');
    }

    return {
      id: procedure.id,
      tenantId: procedure.tenantId,
      userId: procedure.userId,
      name: procedure.name,
      description: procedure.description,
      size: procedure.size,
      complexity: procedure.complexity,
      bodyLocation: procedure.bodyLocation,
      finalPrice: procedure.finalPrice,
      duration: procedure.duration,
      createdAt: procedure.createdAt,
      updatedAt: procedure.updatedAt,
      sessionCount: procedure._count.sessions,
    };
  }

  async update(id: string, tenantId: string, dto: UpdateProcedureDto) {
    const procedure = await this.prisma.procedure.findFirst({
      where: { id, tenantId },
    });

    if (!procedure) {
      throw new NotFoundException('Procedimento não encontrado');
    }

    return this.prisma.procedure.update({
      where: { id },
      data: {
        ...dto,
        finalPrice: dto.finalPrice !== undefined
          ? Math.round(dto.finalPrice * 100) // Converte de R$ para centavos
          : undefined,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const procedure = await this.prisma.procedure.findFirst({
      where: { id, tenantId },
    });

    if (!procedure) {
      throw new NotFoundException('Procedimento não encontrado');
    }

    return this.prisma.procedure.delete({ where: { id } });
  }
}