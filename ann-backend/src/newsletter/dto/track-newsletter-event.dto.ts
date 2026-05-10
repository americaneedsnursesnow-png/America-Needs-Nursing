import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { NewsletterEventType } from '../../database/entities';

export class TrackNewsletterEventDto {
  @IsUUID()
  subscriberId: string;

  @IsEnum(NewsletterEventType)
  eventType: NewsletterEventType;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;
}
