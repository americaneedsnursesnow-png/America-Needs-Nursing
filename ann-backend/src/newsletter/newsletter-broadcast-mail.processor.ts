import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { In, Repository } from 'typeorm';
import {
  NewsletterBroadcast,
  NewsletterBroadcastStatus,
  User,
  UserRole,
} from '../database/entities';
import { uniqueEmailRecipients } from '../mail/email-recipients.util';
import {
  normaliseFrontendBase,
  wrapNewsletterBroadcastEmail,
} from '../mail/email-layouts';
import { MailService } from '../mail/mail.service';
import { NEWSLETTER_BROADCAST_MAIL_QUEUE } from '../queues/queue.constants';

const FAILURE_REASON_MAX = 2000;

export type NewsletterBroadcastMailJobData = {
  broadcastId: string;
  clientName: string;
  subject: string;
  html: string;
};

@Processor(NEWSLETTER_BROADCAST_MAIL_QUEUE, { concurrency: 1 })
export class NewsletterBroadcastMailProcessor extends WorkerHost {
  private readonly logger = new Logger(NewsletterBroadcastMailProcessor.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(NewsletterBroadcast)
    private readonly broadcastsRepository: Repository<NewsletterBroadcast>,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<NewsletterBroadcastMailJobData>): Promise<void> {
    const { broadcastId, clientName, subject, html } = job.data ?? {};
    if (!broadcastId || !clientName || !subject || !html) {
      this.logger.warn('newsletter broadcast job missing fields');
      return;
    }

    const broadcast = await this.broadcastsRepository.findOne({
      where: { id: broadcastId, clientName },
    });
    if (!broadcast) {
      this.logger.warn(`Newsletter broadcast ${broadcastId} not found`);
      return;
    }
    if (broadcast.status !== NewsletterBroadcastStatus.PENDING) {
      this.logger.log(
        `Newsletter broadcast ${broadcastId} is ${broadcast.status}; skip`,
      );
      return;
    }

    if (!this.mailService.isEnabled()) {
      broadcast.status = NewsletterBroadcastStatus.FAILED;
      broadcast.failureReason = truncateReason(
        'Outbound email is not configured on the API server. Set SMTP_HOST (and optional SMTP_USER, SMTP_PASS, MAIL_FROM) or use MAIL_PROVIDER=ses with AWS_SES_REGION and a verified MAIL_FROM. See ann-backend .env.example.',
      );
      broadcast.sentAt = null;
      await this.broadcastsRepository.save(broadcast);
      this.logger.warn('Newsletter broadcast skipped — mail not configured');
      return;
    }

    const users = await this.usersRepository.find({
      where: {
        clientName,
        role: In([UserRole.NURSE, UserRole.COMPANY]),
      },
      select: ['email'],
    });
    const emails = uniqueEmailRecipients(
      users.map((u) => u.email).filter(Boolean),
    );

    const frontendBase = normaliseFrontendBase(
      this.config.get<string>('FRONTEND_URL'),
    );
    const wrappedHtml = wrapNewsletterBroadcastEmail({
      innerHtml: html,
      frontendBase,
    });

    try {
      if (emails.length === 0) {
        broadcast.status = NewsletterBroadcastStatus.SENT;
        broadcast.sentAt = new Date();
        broadcast.recipientCount = 0;
        broadcast.failureReason = null;
        await this.broadcastsRepository.save(broadcast);
        this.logger.log(
          `No nurse/employer emails for client ${clientName}; broadcast ${broadcastId} marked sent`,
        );
        return;
      }

      await this.mailService.sendBulkBcc(emails, subject, wrappedHtml, {
        listUnsubscribeUrl: `${frontendBase}/sign-in`,
      });
      broadcast.status = NewsletterBroadcastStatus.SENT;
      broadcast.sentAt = new Date();
      broadcast.recipientCount = emails.length;
      broadcast.failureReason = null;
      await this.broadcastsRepository.save(broadcast);
      this.logger.log(
        `Newsletter broadcast sent to ${emails.length} recipient(s) for ${clientName} (${broadcastId})`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err ?? 'Unknown error');
      broadcast.status = NewsletterBroadcastStatus.FAILED;
      broadcast.failureReason = truncateReason(message);
      broadcast.sentAt = null;
      await this.broadcastsRepository.save(broadcast);
      this.logger.error(
        `Newsletter broadcast ${broadcastId} failed`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}

function truncateReason(s: string): string {
  const t = s.trim();
  if (t.length <= FAILURE_REASON_MAX) return t;
  return `${t.slice(0, FAILURE_REASON_MAX - 1)}…`;
}
