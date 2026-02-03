import { IsEnum, IsInt, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { TransactionType, TransactionCategory, PaymentMethod } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsEnum(TransactionCategory)
  category!: TransactionCategory;

  @IsInt()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date!: string;
}