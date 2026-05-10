import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities';
import { EngagementService } from './engagement.service';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post('saved-jobs/:jobId')
  @Roles(UserRole.NURSE)
  saveJob(
    @CurrentUser() user: JwtUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.engagementService.saveJob(user, jobId);
  }

  @Delete('saved-jobs/:jobId')
  @Roles(UserRole.NURSE)
  unsaveJob(
    @CurrentUser() user: JwtUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.engagementService.unsaveJob(user, jobId);
  }

  @Get('saved-jobs')
  @Roles(UserRole.NURSE)
  listSaved(@CurrentUser() user: JwtUserPayload) {
    return this.engagementService.listSavedJobs(user);
  }

  @Post('company-follows/:companyId')
  @Roles(UserRole.NURSE)
  follow(
    @CurrentUser() user: JwtUserPayload,
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    return this.engagementService.followCompany(user, companyId);
  }

  @Delete('company-follows/:companyId')
  @Roles(UserRole.NURSE)
  unfollow(
    @CurrentUser() user: JwtUserPayload,
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    return this.engagementService.unfollowCompany(user, companyId);
  }

  @Get('company-follows')
  @Roles(UserRole.NURSE)
  listFollows(@CurrentUser() user: JwtUserPayload) {
    return this.engagementService.listFollows(user);
  }
}
