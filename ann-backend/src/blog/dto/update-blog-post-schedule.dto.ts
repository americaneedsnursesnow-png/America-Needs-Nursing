import { IsDateString } from 'class-validator';

export class UpdateBlogPostScheduleDto {
  @IsDateString()
  scheduledAt: string;
}
