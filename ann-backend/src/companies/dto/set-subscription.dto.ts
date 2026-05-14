import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class SetSubscriptionDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  @MaxLength(255)
  subscriptionPlanName?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  subscriptionExpiresAt?: Date | null;
}
