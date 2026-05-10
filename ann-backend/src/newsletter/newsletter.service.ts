import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { sanitizeBlogRichHtml } from '../common/html/sanitize-stored-html';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { NewsletterEvent, NewsletterSubscriber } from '../database/entities';
import {
  NEWSLETTER_BROADCAST_MAIL_JOB,
  NEWSLETTER_BROADCAST_MAIL_QUEUE,
} from '../queues/queue.constants';
import { BroadcastNewsletterDto } from './dto/broadcast-newsletter.dto';
import { TrackNewsletterEventDto } from './dto/track-newsletter-event.dto';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly subscribersRepository: Repository<NewsletterSubscriber>,
    @InjectRepository(NewsletterEvent)
    private readonly eventsRepository: Repository<NewsletterEvent>,
    @InjectQueue(NEWSLETTER_BROADCAST_MAIL_QUEUE)
    private readonly newsletterBroadcastQueue: Queue,
  ) {}

  async subscribe(
    clientName: string,
    email: string,
  ): Promise<NewsletterSubscriber> {
    const normalized = email.trim().toLowerCase();
    const exists = await this.subscribersRepository.findOne({
      where: { clientName, email: normalized },
    });
    if (exists) {
      if (!exists.active) {
        exists.active = true;
        exists.unsubscribeToken = randomUUID();
        return this.subscribersRepository.save(exists);
      }
      throw new ConflictException('Already subscribed');
    }
    return this.subscribersRepository.save(
      this.subscribersRepository.create({
        clientName,
        email: normalized,
        active: true,
        unsubscribeToken: randomUUID(),
      }),
    );
  }

  /**
   * Idempotent: used when a user account is created so they receive blog / updates
   * without going through the public subscribe form. Does not throw if already active.
   */
  async ensureSubscriber(clientName: string, email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const exists = await this.subscribersRepository.findOne({
      where: { clientName, email: normalized },
    });
    if (exists) {
      if (!exists.active) {
        exists.active = true;
        exists.unsubscribeToken = randomUUID();
        await this.subscribersRepository.save(exists);
      }
      return;
    }
    await this.subscribersRepository.save(
      this.subscribersRepository.create({
        clientName,
        email: normalized,
        active: true,
        unsubscribeToken: randomUUID(),
      }),
    );
  }

  /**
   * Queues a bulk email to every nurse + employer user for the tenant (ops/admin sends).
   */
  async enqueueBroadcast(
    clientName: string,
    dto: BroadcastNewsletterDto,
  ): Promise<{ queued: true; jobId: string }> {
    const subject = dto.subject.trim();
    const html = sanitizeBlogRichHtml(dto.html).trim();
    if (!html) {
      throw new BadRequestException('HTML body is empty after sanitizing');
    }
    const jobId = `newsletter-broadcast-${clientName}-${Date.now()}`;
    await this.newsletterBroadcastQueue.add(
      NEWSLETTER_BROADCAST_MAIL_JOB,
      { clientName, subject, html },
      {
        jobId,
        removeOnComplete: 500,
        attempts: 2,
        backoff: { type: 'exponential', delay: 15_000 },
      },
    );
    this.logger.log(`Newsletter broadcast queued: ${jobId}`);
    return { queued: true, jobId };
  }

  async unsubscribeByToken(token: string): Promise<void> {
    const sub = await this.subscribersRepository.findOne({
      where: { unsubscribeToken: token },
    });
    if (!sub) {
      return;
    }
    sub.active = false;
    await this.subscribersRepository.save(sub);
  }

  async trackEvent(dto: TrackNewsletterEventDto): Promise<NewsletterEvent> {
    return this.eventsRepository.save(
      this.eventsRepository.create({
        subscriberId: dto.subscriberId,
        eventType: dto.eventType,
        url: dto.url?.trim() ?? null,
        metadata: null,
      }),
    );
  }
}
