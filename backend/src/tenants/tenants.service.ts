import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    return tenant;
  }

  async update(tenantId: string, dto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: dto,
    });
  }

  async getStudioConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.type !== 'STUDIO') {
      return null;
    }

    return this.prisma.studioConfig.findUnique({
      where: { tenantId },
      include: {
        tatuadorBenefits: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async updateStudioConfig(tenantId: string, defaultPercentage: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.type !== 'STUDIO') {
      throw new BadRequestException(
        'Configuração de estúdio disponível apenas para tenants do tipo STUDIO',
      );
    }

    return this.prisma.studioConfig.upsert({
      where: { tenantId },
      update: { defaultPercentage },
      create: { tenantId, defaultPercentage },
    });
  }

  async addTatuadorBenefit(
    tenantId: string,
    userId: string,
    percentage: number,
    reason?: string,
  ) {
    const config = await this.prisma.studioConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new BadRequestException(
        'Configure o estúdio antes de adicionar benefícios',
      );
    }

    return this.prisma.tatuadorBenefit.create({
      data: {
        studioConfigId: config.id,
        userId,
        percentage,
        reason,
      },
    });
  }

  async removeTatuadorBenefit(benefitId: string) {
    const benefit = await this.prisma.tatuadorBenefit.findUnique({
      where: { id: benefitId },
    });

    if (!benefit) {
      throw new NotFoundException('Benefício não encontrado');
    }

    return this.prisma.tatuadorBenefit.delete({
      where: { id: benefitId },
    });
  }
}