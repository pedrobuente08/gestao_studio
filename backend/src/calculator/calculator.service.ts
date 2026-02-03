import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCostDto } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';

@Injectable()
export class CalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  async addCost(tenantId: string, dto: CreateCostDto) {
    if (dto.type === 'fixed') {
      return this.prisma.fixedCost.create({
        data: { tenantId, name: dto.name, amount: dto.amount },
      });
    }

    return this.prisma.variableCost.create({
      data: { tenantId, name: dto.name, amount: dto.amount },
    });
  }

  async removeCost(id: string, tenantId: string, type: 'fixed' | 'variable') {
    if (type === 'fixed') {
      const cost = await this.prisma.fixedCost.findFirst({
        where: { id, tenantId },
      });
      if (!cost) throw new NotFoundException('Custo fixo não encontrado');
      return this.prisma.fixedCost.delete({ where: { id } });
    }

    const cost = await this.prisma.variableCost.findFirst({
      where: { id, tenantId },
    });
    if (!cost) throw new NotFoundException('Custo variável não encontrado');
    return this.prisma.variableCost.delete({ where: { id } });
  }

  async updateCost(
    id: string,
    tenantId: string,
    type: 'fixed' | 'variable',
    dto: UpdateCostDto,
  ) {
    if (type === 'fixed') {
      const cost = await this.prisma.fixedCost.findFirst({
        where: { id, tenantId },
      });
      if (!cost) throw new NotFoundException('Custo fixo não encontrado');
      return this.prisma.fixedCost.update({ where: { id }, data: dto });
    }

    const cost = await this.prisma.variableCost.findFirst({
      where: { id, tenantId },
    });
    if (!cost) throw new NotFoundException('Custo variável não encontrado');
    return this.prisma.variableCost.update({ where: { id }, data: dto });
  }

  async setWorkSettings(
    tenantId: string,
    hoursPerMonth: number,
    profitMargin: number,
  ) {
    return this.prisma.workSettings.upsert({
      where: { tenantId },
      update: { hoursPerMonth, profitMargin },
      create: { tenantId, hoursPerMonth, profitMargin },
    });
  }

  async calculate(tenantId: string) {
    const [fixedCosts, variableCosts, workSettings] = await Promise.all([
      this.prisma.fixedCost.findMany({ where: { tenantId } }),
      this.prisma.variableCost.findMany({ where: { tenantId } }),
      this.prisma.workSettings.findUnique({ where: { tenantId } }),
    ]);

    const totalFixed = fixedCosts.reduce((sum, c) => sum + c.amount, 0);
    const totalVariable = variableCosts.reduce((sum, c) => sum + c.amount, 0);
    const totalCosts = totalFixed + totalVariable;

    const hoursPerMonth = workSettings?.hoursPerMonth ?? 160;
    const profitMargin = workSettings?.profitMargin ?? 30;

    const costPerHour =
      hoursPerMonth > 0 ? Math.round(totalCosts / hoursPerMonth) : 0;
    const minimumPricePerHour = Math.round(
      costPerHour * (1 + profitMargin / 100),
    );

    return {
      fixedCosts: fixedCosts.map((c) => ({
        id: c.id,
        name: c.name,
        amount: c.amount,
      })),
      variableCosts: variableCosts.map((c) => ({
        id: c.id,
        name: c.name,
        amount: c.amount,
      })),
      totalFixed,
      totalVariable,
      totalCosts,
      hoursPerMonth,
      profitMargin,
      costPerHour,
      minimumPricePerHour,
      quickReference: {
        '1h': minimumPricePerHour,
        '2h': minimumPricePerHour * 2,
        '3h': minimumPricePerHour * 3,
        '5h': minimumPricePerHour * 5,
      },
    };
  }
}