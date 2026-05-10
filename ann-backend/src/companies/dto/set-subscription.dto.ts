import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional } from 'class-validator';

export class SetSubscriptionDto {
  @IsBoolean()
  subscriptionActive: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  subscriptionExpiresAt?: Date | null;
}
