import { IsDateString } from 'class-validator';

export class UpdateNewsletterBroadcastScheduleDto {
  @IsDateString()
  scheduledAt: string;
}
