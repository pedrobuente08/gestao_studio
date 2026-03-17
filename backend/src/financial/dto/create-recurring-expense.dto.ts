import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { TransactionCategory } from '@prisma/client';

export class CreateRecurringExpenseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(1)
  amount!: number; // em centavos

  @IsOptional()
  @IsIn(Object.values(TransactionCategory))
  category?: TransactionCategory;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth?: number;
}
