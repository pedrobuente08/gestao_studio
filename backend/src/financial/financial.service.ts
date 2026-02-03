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
    },
  ) {
    let where: any = { tenantId };

    if (role === UserRole.EMPLOYEE && userId) {
      where.session = { userId };
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

  async getSummary(tenantId: string, userId?: string, role?: UserRole) {
    let where: any = { tenantId };

    if (role === UserRole.EMPLOYEE && userId) {
      where.session = { userId };
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
}