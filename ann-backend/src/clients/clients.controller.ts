import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { ClientsService } from './clients.service';
import { UpdateClientFreeTierDto } from './dto/update-client-free-tier.dto';

@Controller('clients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('platform-settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getPlatformSettings(@CurrentUser() user: JwtUserPayload) {
    return this.clientsService.getPlatformSettingsForClientName(
      user.clientName,
    );
  }

  @Patch('platform-settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  patchPlatformSettings(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: UpdateClientFreeTierDto,
  ) {
    return this.clientsService.setFreeTierJobPostsPerMonthForClientName(
      user.clientName,
      dto.freeTierJobPostsPerMonth,
    );
  }
}
