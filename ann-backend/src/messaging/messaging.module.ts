import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from '../applications/applications.module';
import { AuthModule } from '../auth/auth.module';
import { Conversation, Message, User } from '../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobMessagingGateway } from './job-messaging.gateway';
import { MessagingService } from './messaging.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, User]),
    AuthModule,
    ApplicationsModule,
    NotificationsModule,
  ],
  providers: [MessagingService, JobMessagingGateway],
})
export class MessagingModule {}
