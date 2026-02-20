import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';

// Apenas Tatuagem é criada automaticamente — Piercing, Laser e outros são adicionados pelo usuário
const SYSTEM_SERVICE_TYPES = ['Tatuagem'];

@Injectable()
export class ServiceTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSystemTypes(tenantId: string) {
    for (const name of SYSTEM_SERVICE_TYPES) {
      const existing = await this.prisma.serviceType.findFirst({
        where: { tenantId, name, isSystem: true },
      });
      if (!existing) {
        await this.prisma.serviceType.create({
          data: { tenantId, name, isSystem: true },
        });
      }
    }
  }

  async findAll(tenantId: string) {
    await this.ensureSystemTypes(tenantId);

    return this.prisma.serviceType.findMany({
      where: { tenantId },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async create(tenantId: string, dto: CreateServiceTypeDto) {
    const existing = await this.prisma.serviceType.findFirst({
      where: { tenantId, name: { equals: dto.name, mode: 'insensitive' } },
    });

    if (existing) {
      throw new ConflictException('Já existe um tipo de serviço com este nome');
    }

    return this.prisma.serviceType.create({
      data: { tenantId, name: dto.name, isSystem: false },
    });
  }

  async remove(id: string, tenantId: string) {
    const serviceType = await this.prisma.serviceType.findFirst({
      where: { id, tenantId },
    });

    if (!serviceType) {
      throw new NotFoundException('Tipo de serviço não encontrado');
    }

    if (serviceType.isSystem) {
      throw new ForbiddenException('Tipos de serviço padrão não podem ser removidos');
    }

    const hasSessions = await this.prisma.tattooSession.count({
      where: { serviceTypeId: id },
    });

    if (hasSessions > 0) {
      throw new ConflictException(
        'Este tipo de serviço possui procedimentos registrados e não pode ser removido',
      );
    }

    return this.prisma.serviceType.delete({ where: { id } });
  }
}
