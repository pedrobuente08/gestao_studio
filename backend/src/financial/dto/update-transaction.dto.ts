import { IsEnum, IsInt, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { TransactionType, TransactionCategory, PaymentMethod } from '@prisma/client';

export class UpdateTransactionDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}