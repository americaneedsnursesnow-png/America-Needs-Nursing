import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  CommunityChatMessage,
  CommunityComment,
  CommunityMemberReport,
  CommunityPost,
  NurseCommunity,
  NurseCommunityMember,
  NurseProfile,
  User,
} from '../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommunityChatGateway } from './community-chat.gateway';
import { CommunityChatService } from './community-chat.service';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { NurseCommunityController } from './nurse-community.controller';
import { NurseCommunityService } from './nurse-community.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommunityPost,
      CommunityComment,
      CommunityMemberReport,
      NurseProfile,
      CommunityChatMessage,
      NurseCommunity,
      NurseCommunityMember,
      User,
    ]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [CommunityController, NurseCommunityController],
  providers: [
    CommunityService,
    NurseCommunityService,
    CommunityChatService,
    CommunityChatGateway,
  ],
})
export class CommunityModule {}
