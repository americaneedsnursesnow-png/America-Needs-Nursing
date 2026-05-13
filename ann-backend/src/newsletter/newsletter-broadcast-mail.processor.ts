import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { In, Repository } from 'typeorm';
import { User, UserRole } from '../database/entities';
import { uniqueEmailRecipients } from '../mail/email-recipients.util';
import {
  normaliseFrontendBase,
  wrapNewsletterBroadcastEmail,
} from '../mail/email-layouts';
import { MailService } from '../mail/mail.service';
import { NEWSLETTER_BROADCAST_MAIL_QUEUE } from '../queues/queue.constants';

export type NewsletterBroadcastMailJobData = {
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
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<NewsletterBroadcastMailJobData>): Promise<void> {
    const { clientName, subject, html } = job.data ?? {};
    if (!clientName || !subject || !html) {
      this.logger.warn('newsletter broadcast job missing fields');
      return;
    }

    if (!this.mailService.isEnabled()) {
      this.logger.warn('Newsletter broadcast skipped — SMTP not configured');
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
    if (emails.length === 0) {
      this.logger.log(
        `No nurse/employer emails for client ${clientName}; skip broadcast`,
      );
      return;
    }

    const frontendBase = normaliseFrontendBase(
      this.config.get<string>('FRONTEND_URL'),
    );
    const wrappedHtml = wrapNewsletterBroadcastEmail({
      innerHtml: html,
      frontendBase,
    });

    await this.mailService.sendBulkBcc(emails, subject, wrappedHtml);
    this.logger.log(
      `Newsletter broadcast sent to ${emails.length} recipient(s) for ${clientName}`,
    );
  }
}
