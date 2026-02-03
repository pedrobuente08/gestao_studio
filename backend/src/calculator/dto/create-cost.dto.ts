import { IsIn, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateCostDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(0)
  amount!: number;

  @IsIn(['fixed', 'variable'])
  type!: 'fixed' | 'variable';
}