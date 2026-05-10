import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateClientFreeTierDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  freeTierJobPostsPerMonth: number;
}
