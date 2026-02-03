import { TransactionType, TransactionCategory, PaymentMethod } from '@prisma/client';

export class TransactionClientDto {
  id!: string;
  name!: string;
}

export class TransactionResponseDto {
  id!: string;
  tenantId!: string;
  type!: TransactionType;
  category!: TransactionCategory;
  amount!: number;
  paymentMethod!: PaymentMethod | null;
  clientId!: string | null;
  sessionId!: string | null;
  description!: string | null;
  date!: Date;
  createdAt!: Date;
  updatedAt!: Date;
  client!: TransactionClientDto | null;
}

export class FinancialSummaryDto {
  totalIncome!: number;
  totalExpense!: number;
  balance!: number;
}