import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TransactionCategory } from '@prisma/client';

export class UpdateRecurringExpenseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsIn(Object.values(TransactionCategory))
  category?: TransactionCategory;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
