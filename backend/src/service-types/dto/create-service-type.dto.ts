import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateServiceTypeDto {
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  @MaxLength(50, { message: 'Nome deve ter no máximo 50 caracteres' })
  name!: string;
}
