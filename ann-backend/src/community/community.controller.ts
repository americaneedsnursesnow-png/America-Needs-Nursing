import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DEFAULT_CLIENT_NAME } from '../common/constants';
import { AuthGuard } from '@nestjs/passport';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities';
import { SkipRateLimit } from '../rate-limit/decorators/skip-rate-limit.decorator';
import { CommunityChatService } from './community-chat.service';
import { CommunityService } from './community.service';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { ReportCommunityMemberDto } from './dto/report-community-member.dto';

@SkipRateLimit()
@Controller('community')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly communityChatService: CommunityChatService,
  ) {}

  @Get('chat/history')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  getChatHistory(
    @CurrentUser() user: JwtUserPayload,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return this.communityChatService.getRecentHistoryForGlobal(user, limit);
  }

  @Get('chat/mention-suggestions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  getChatMentionSuggestions(@CurrentUser() user: JwtUserPayload) {
    return this.communityService.listNursesForGlobalChatMentions(
      user.clientName,
    );
  }

  @Get('posts')
  listPosts(
    @Query('clientName', new DefaultValuePipe(DEFAULT_CLIENT_NAME))
    clientName: string,
  ) {
    return this.communityService.listPosts(clientName.trim());
  }

  @Get('posts/:id')
  getPost(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('clientName', new DefaultValuePipe(DEFAULT_CLIENT_NAME))
    clientName: string,
  ) {
    return this.communityService.getPost(clientName.trim(), id);
  }

  @Get('posts/:id/comments')
  listComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('clientName', new DefaultValuePipe(DEFAULT_CLIENT_NAME))
    clientName: string,
  ) {
    return this.communityService.listComments(clientName.trim(), id);
  }

  @Post('posts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  createPost(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateCommunityPostDto,
  ) {
    return this.communityService.createPost(user, dto);
  }

  @Post('posts/:id/comments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  addComment(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommunityCommentDto,
  ) {
    return this.communityService.addComment(user, id, dto);
  }

  @Post('members/report')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  reportMember(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: ReportCommunityMemberDto,
  ) {
    return this.communityService.reportMember(user, dto);
  }

  @Get('admin/member-reports')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  listMemberReports(@CurrentUser() user: JwtUserPayload) {
    return this.communityService.listMemberReportsForAdmin(user.clientName);
  }

  @Post('admin/members/:userId/ban-from-community')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  banFromCommunity(
    @CurrentUser() user: JwtUserPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.communityService.banNurseFromCommunity(user.clientName, userId);
  }
}
