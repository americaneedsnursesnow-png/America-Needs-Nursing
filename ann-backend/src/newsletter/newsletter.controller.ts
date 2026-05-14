import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { UserRole } from '../database/entities';
import { BroadcastNewsletterDto } from './dto/broadcast-newsletter.dto';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { TrackNewsletterEventDto } from './dto/track-newsletter-event.dto';
import { UpdateNewsletterBroadcastScheduleDto } from './dto/update-newsletter-broadcast-schedule.dto';
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

  /** Staff admin: whether the API has SMTP or SES configured (newsletters and auth email). */
  @Get('admin/mail-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_ADMIN)
  adminMailStatus() {
    return this.newsletterService.getOutboundMailStatus();
  }

  /** Staff admin: paginated newsletter broadcasts for the JWT tenant (`page`, `limit` query; default limit 10). */
  @Get('admin/broadcasts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_ADMIN)
  adminListBroadcasts(
    @CurrentUser() user: JwtUserPayload,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const page = Math.max(1, parseInt(String(pageRaw ?? '1'), 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(String(limitRaw ?? '10'), 10) || 10),
    );
    return this.newsletterService.listAdminBroadcastsPaginated(
      user.clientName,
      page,
      limit,
    );
  }

  /** Staff admin: change send time for a pending broadcast. */
  @Patch('admin/broadcasts/:id/schedule')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_ADMIN)
  adminRescheduleBroadcast(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateNewsletterBroadcastScheduleDto,
  ) {
    return this.newsletterService.rescheduleBroadcast(
      user.clientName,
      id,
      dto,
    );
  }

  /** Staff admin: persist broadcast and queue email to all nurses + employers for the same tenant as the JWT. */
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
