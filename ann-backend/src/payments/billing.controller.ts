import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { SyncCheckoutSessionDto } from './dto/sync-checkout-session.dto';
import { PaymentsService } from './payments.service';

@Controller('billing')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BillingController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('stripe/checkout-session')
  @Roles(UserRole.COMPANY)
  createCheckoutSession(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.paymentsService.createCheckoutSession(user, dto);
  }

  @Post('stripe/sync-checkout-session')
  @Roles(UserRole.COMPANY)
  @HttpCode(HttpStatus.OK)
  syncCheckoutSession(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: SyncCheckoutSessionDto,
  ) {
    return this.paymentsService.syncCheckoutSessionForEmployer(
      user,
      dto.sessionId,
    );
  }
}
