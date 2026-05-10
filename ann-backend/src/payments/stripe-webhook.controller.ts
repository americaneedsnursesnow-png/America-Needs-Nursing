import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

type RequestWithRawBody = Request & { rawBody?: Buffer };

@Controller('payments/stripe')
export class StripeWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @HttpCode(200)
  async handle(
    @Req() req: RequestWithRawBody,
    @Headers('stripe-signature') signature?: string,
  ) {
    const rawBody = req.rawBody;
    if (!Buffer.isBuffer(rawBody)) {
      throw new BadRequestException('Raw body required for Stripe webhook');
    }
    return this.paymentsService.handleStripeWebhook(signature, rawBody);
  }
}
