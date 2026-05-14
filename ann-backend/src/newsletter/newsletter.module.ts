import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  NewsletterBroadcast,
  NewsletterEvent,
  NewsletterSubscriber,
  User,
} from '../database/entities';
import { MailModule } from '../mail/mail.module';
import { NEWSLETTER_BROADCAST_MAIL_QUEUE } from '../queues/queue.constants';
import { NewsletterBroadcastMailProcessor } from './newsletter-broadcast-mail.processor';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NewsletterSubscriber,
      NewsletterEvent,
      NewsletterBroadcast,
      User,
    ]),
    BullModule.registerQueue({ name: NEWSLETTER_BROADCAST_MAIL_QUEUE }),
    MailModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [NewsletterController],
  providers: [NewsletterService, NewsletterBroadcastMailProcessor],
  exports: [NewsletterService],
})
export class NewsletterModule {}
