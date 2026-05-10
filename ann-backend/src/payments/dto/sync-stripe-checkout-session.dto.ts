import { IsString, MinLength } from 'class-validator';

export class SyncStripeCheckoutSessionDto {
  /** Stripe Checkout Session id (e.g. `cs_test_...`). */
  @IsString()
  @MinLength(8)
  sessionId: string;
}
