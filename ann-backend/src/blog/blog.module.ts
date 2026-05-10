import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BlogPost, NewsletterSubscriber } from '../database/entities';
import { MailModule } from '../mail/mail.module';
import { BLOG_PUBLISH_MAIL_QUEUE } from '../queues/queue.constants';
import { BlogController } from './blog.controller';
import { BlogPublishMailProcessor } from './blog-publish-mail.processor';
import { BlogPublishNotificationsService } from './blog-publish-notifications.service';
import { BlogService } from './blog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogPost, NewsletterSubscriber]),
    BullModule.registerQueue({ name: BLOG_PUBLISH_MAIL_QUEUE }),
    AuthModule,
    MailModule,
  ],
  controllers: [BlogController],
  providers: [
    BlogService,
    BlogPublishNotificationsService,
    BlogPublishMailProcessor,
  ],
  exports: [BlogService],
})
export class BlogModule {}
