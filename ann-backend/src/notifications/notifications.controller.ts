import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: JwtUserPayload) {
    return this.notificationsService.listForUser(user.sub, user.clientName);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: JwtUserPayload) {
    return this.notificationsService
      .countUnreadForUser(user.sub, user.clientName)
      .then((count) => ({ count }));
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.markRead(id, user.sub, user.clientName);
  }
}
