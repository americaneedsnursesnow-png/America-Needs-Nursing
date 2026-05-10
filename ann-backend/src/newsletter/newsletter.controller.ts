import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { UserRole } from '../database/entities';
import { BroadcastNewsletterDto } from './dto/broadcast-newsletter.dto';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { TrackNewsletterEventDto } from './dto/track-newsletter-event.dto';
import { NewsletterService } from './newsletter.service';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  subscribe(@Body() dto: SubscribeNewsletterDto) {
    const clientName = dto.clientName.trim();
    return this.newsletterService.subscribe(clientName, dto.email);
  }

  @Get('unsubscribe')
  unsubscribe(@Query('token') token: string) {
    return this.newsletterService.unsubscribeByToken(token?.trim() ?? '');
  }

  @Post('track')
  track(@Body() dto: TrackNewsletterEventDto) {
    return this.newsletterService.trackEvent(dto);
  }

  /** Staff admin: queue email to all nurses + employers for the same tenant as the JWT. */
  @Post('admin/broadcast')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_ADMIN)
  adminBroadcast(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: BroadcastNewsletterDto,
  ) {
    return this.newsletterService.enqueueBroadcast(user.clientName, dto);
  }
}
