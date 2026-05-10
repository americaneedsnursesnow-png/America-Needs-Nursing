import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsUUID('4')
  packageId: string;

  /**
   * When true, creates an embedded Checkout Session (`client_secret` for Stripe.js iframe).
   * When false/omitted, returns a hosted Checkout `url` (redirect).
   */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  embedded?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(10)
  successUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  cancelUrl?: string;
}
