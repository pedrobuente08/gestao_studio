import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, TransactionType } from '@prisma/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateTransactionDto) {
    const transaction = await this.prisma.transaction.create({
      data: {
        tenantId,
        type: dto.type,
        category: dto.category,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        clientId: dto.clientId,
        description: dto.description,
        date: new Date(dto.date),
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return transaction;
  }

  async findAll(
    tenantId: string,
    userId?: string,
    role?: UserRole,
    filters?: {
      type?: TransactionType;
      category?: string;
      startDate?: string;
      endDate?: string;
      filterUserId?: string;
    },
  ) {
    let where: any = { tenantId };

    if (role === UserRole.EMPLOYEE && userId) {
      where.session = { userId };
    } else if (filters?.filterUserId) {
      where.session = { userId: filters.filterUserId };
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return transactions;
  }

  async getSummary(
    tenantId: string,
    userId?: string,
    role?: UserRole,
    filters?: { startDate?: string; endDate?: string; filterUserId?: string },
  ) {
    let where: any = { tenantId };

    if (role === UserRole.EMPLOYEE && userId) {
      where.session = { userId };
    } else if (filters?.filterUserId) {
      where.session = { userId: filters.filterUserId };
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const incomeAgg = await this.prisma.transaction.aggregate({
      where: { ...where, type: TransactionType.INCOME },
      _sum: { amount: true },
    });

    const expenseAgg = await this.prisma.transaction.aggregate({
      where: { ...where, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    });

    const totalIncome = incomeAgg._sum.amount ?? 0;
    const totalExpense = expenseAgg._sum.amount ?? 0;

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }

  async getMonthlySummary(tenantId: string) {
    const now = new Date();
    const months: { label: string; income: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const agg = await this.prisma.transaction.aggregate({
        where: {
          tenantId,
          type: TransactionType.INCOME,
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' });
      months.push({
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1).replace('.', ''),
        income: agg._sum.amount ?? 0,
      });
    }

    return months;
  }

  async findOne(id: string, tenantId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, tenantId },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    return transaction;
  }

  async update(id: string, tenantId: string, dto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, tenantId },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    if (transaction.sessionId) {
      throw new BadRequestException(
        'Não é possível atualizar transações vinculadas a sessões',
      );
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, tenantId },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    if (transaction.sessionId) {
      throw new BadRequestException(
        'Não é possível deletar transações vinculadas a sessões',
      );
    }

    return this.prisma.transaction.delete({ where: { id } });
  }

  async getRevenueSplit(
    tenantId: string,
    filters?: { startDate?: string; endDate?: string },
  ) {
    const where: any = { tenantId };

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const sessions = await this.prisma.tattooSession.findMany({
      where,
      select: {
        finalPrice: true,
        studioFee: true,
        tatuadorRevenue: true,
        studioPercentage: true,
        userId: true,
        user: { select: { studioPercentage: true } },
      },
    });

    const workSettings = await this.prisma.workSettings.findUnique({
      where: { tenantId },
    });

    // Percentual global só se aplica no modo STUDIO_PERCENTAGE
    const globalPct =
      workSettings?.mode === 'STUDIO_PERCENTAGE'
        ? (workSettings.studioPercentage ?? 0)
        : 0;

    let studioRevenue = 0;
    let prestadorRevenue = 0;
    let totalRevenue = 0;

    for (const s of sessions) {
      totalRevenue += s.finalPrice;

      if (s.studioFee !== null && s.studioFee !== undefined) {
        // studioFee já calculado e salvo na sessão
        studioRevenue += s.studioFee;
        prestadorRevenue += s.tatuadorRevenue ?? (s.finalPrice - s.studioFee);
      } else {
        // Percentual individual do prestador tem prioridade; fallback para global
        const pct = s.user?.studioPercentage ?? s.studioPercentage ?? globalPct;
        if (pct > 0) {
          const fee = Math.round((s.finalPrice * pct) / 100);
          studioRevenue += fee;
          prestadorRevenue += s.finalPrice - fee;
        } else {
          // Sem percentual configurado: prestador fica com tudo
          prestadorRevenue += s.finalPrice;
        }
      }
    }

    return { totalRevenue, studioRevenue, prestadorRevenue };
  }
}