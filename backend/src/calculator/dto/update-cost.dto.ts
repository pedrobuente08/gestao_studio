import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCostDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  amount?: number;
}