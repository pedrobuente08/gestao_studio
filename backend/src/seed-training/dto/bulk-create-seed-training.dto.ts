import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { CreateSeedTrainingDto } from './create-seed-training.dto';

export class BulkCreateSeedTrainingDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CreateSeedTrainingDto)
  entries!: CreateSeedTrainingDto[];
}
