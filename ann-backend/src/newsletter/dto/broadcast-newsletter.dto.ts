import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class BroadcastNewsletterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject: string;

  /** Full HTML body for the campaign email. */
  @IsString()
  @MinLength(1)
  @MaxLength(500000)
  html: string;

  /** ISO-8601 send time (UTC). Omit for immediate send. */
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
