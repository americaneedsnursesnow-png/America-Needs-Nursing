import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SyncCheckoutSessionDto {
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  @Matches(/^cs_[A-Za-z0-9]+$/, {
    message: 'sessionId must be a Stripe Checkout Session id (cs_…)',
  })
  sessionId: string;
}
