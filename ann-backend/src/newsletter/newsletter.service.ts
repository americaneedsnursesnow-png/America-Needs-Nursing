import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { sanitizeBlogRichHtml } from '../common/html/sanitize-stored-html';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import {
  NewsletterBroadcast,
  NewsletterBroadcastStatus,
  NewsletterEvent,
  NewsletterSubscriber,
} from '../database/entities';
import {
  NEWSLETTER_BROADCAST_MAIL_JOB,
  NEWSLETTER_BROADCAST_MAIL_QUEUE,
} from '../queues/queue.constants';
import { MailService } from '../mail/mail.service';
import { BroadcastNewsletterDto } from './dto/broadcast-newsletter.dto';
import { TrackNewsletterEventDto } from './dto/track-newsletter-event.dto';
import { UpdateNewsletterBroadcastScheduleDto } from './dto/update-newsletter-broadcast-schedule.dto';

export type NewsletterBroadcastListItem = {
  id: string;
  subject: string;
  status: NewsletterBroadcastStatus;
  scheduledAt: string;
  sentAt: string | null;
  recipientCount: number | null;
  failureReason: string | null;
  createdAt: string;
};

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly subscribersRepository: Repository<NewsletterSubscriber>,
    @InjectRepository(NewsletterEvent)
    private readonly eventsRepository: Repository<NewsletterEvent>,
    @InjectRepository(NewsletterBroadcast)
    private readonly broadcastsRepository: Repository<NewsletterBroadcast>,
    @InjectQueue(NEWSLETTER_BROADCAST_MAIL_QUEUE)
    private readonly newsletterBroadcastQueue: Queue,
    private readonly mailService: MailService,
  ) {}

  getOutboundMailStatus(): { outboundEmailConfigured: boolean } {
    return { outboundEmailConfigured: this.mailService.isEnabled() };
  }

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
   * Persist a broadcast, queue a delayed Bull job, return identifiers for the admin UI.
   */
  async enqueueBroadcast(
    clientName: string,
    dto: BroadcastNewsletterDto,
  ): Promise<{
    queued: true;
    broadcastId: string;
    jobId: string;
    scheduledAt: string;
    status: NewsletterBroadcastStatus;
  }> {
    const subject = dto.subject.trim();
    const html = sanitizeBlogRichHtml(dto.html).trim();
    if (!html) {
      throw new BadRequestException('HTML body is empty after sanitizing');
    }
    const scheduledAt = this.parseScheduledAt(dto.scheduledAt);
    const row = this.broadcastsRepository.create({
      clientName,
      subject,
      html,
      status: NewsletterBroadcastStatus.PENDING,
      scheduledAt,
      sentAt: null,
      recipientCount: null,
      failureReason: null,
    });
    const saved = await this.broadcastsRepository.save(row);
    const jobId = this.bullJobIdForBroadcast(saved.id);
    try {
      await this.addBroadcastQueueJob(saved, jobId);
    } catch (err) {
      await this.broadcastsRepository.remove(saved);
      throw err;
    }
    this.logger.log(`Newsletter broadcast queued: ${jobId} (${saved.id})`);
    return {
      queued: true,
      broadcastId: saved.id,
      jobId,
      scheduledAt: saved.scheduledAt.toISOString(),
      status: saved.status,
    };
  }

  async listAdminBroadcastsPaginated(
    clientName: string,
    page: number,
    limit: number,
  ): Promise<{
    items: NewsletterBroadcastListItem[];
    meta: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const take = Math.min(50, Math.max(1, limit));
    const totalItems = await this.broadcastsRepository.count({
      where: { clientName },
    });
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / take);
    const requestedPage = Math.max(1, page);
    const effectivePage = Math.min(requestedPage, totalPages);
    const skip = (effectivePage - 1) * take;

    const rows = await this.broadcastsRepository.find({
      where: { clientName },
      order: { scheduledAt: 'DESC' },
      skip,
      take,
      select: [
        'id',
        'subject',
        'status',
        'scheduledAt',
        'sentAt',
        'recipientCount',
        'failureReason',
        'createdAt',
      ],
    });
    const items = rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      status: r.status,
      scheduledAt: r.scheduledAt.toISOString(),
      sentAt: r.sentAt ? r.sentAt.toISOString() : null,
      recipientCount: r.recipientCount,
      failureReason: r.failureReason,
      createdAt: r.createdAt.toISOString(),
    }));
    return {
      items,
      meta: {
        page: effectivePage,
        limit: take,
        totalItems,
        totalPages,
      },
    };
  }

  async rescheduleBroadcast(
    clientName: string,
    broadcastId: string,
    dto: UpdateNewsletterBroadcastScheduleDto,
  ): Promise<{ ok: true; broadcastId: string; jobId: string; scheduledAt: string }> {
    const scheduledAt = this.parseScheduledAt(dto.scheduledAt);
    const row = await this.broadcastsRepository.findOne({
      where: { id: broadcastId, clientName },
    });
    if (!row) {
      throw new NotFoundException('Newsletter broadcast not found');
    }
    if (row.status !== NewsletterBroadcastStatus.PENDING) {
      throw new BadRequestException(
        'Only pending newsletters can be rescheduled',
      );
    }
    const jobId = this.bullJobIdForBroadcast(row.id);
    const existing = await this.newsletterBroadcastQueue.getJob(jobId);
    if (existing) {
      await existing.remove();
    }
    row.scheduledAt = scheduledAt;
    await this.broadcastsRepository.save(row);
    await this.addBroadcastQueueJob(row, jobId);
    return {
      ok: true,
      broadcastId: row.id,
      jobId,
      scheduledAt: row.scheduledAt.toISOString(),
    };
  }

  private parseScheduledAt(raw: string | undefined): Date {
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      return new Date();
    }
    const d = new Date(String(raw).trim());
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException('scheduledAt must be a valid date');
    }
    return d;
  }

  private bullJobIdForBroadcast(broadcastId: string): string {
    return `newsletter-broadcast-${broadcastId}`;
  }

  private async addBroadcastQueueJob(
    broadcast: NewsletterBroadcast,
    jobId: string,
  ): Promise<void> {
    const delay = Math.max(
      0,
      broadcast.scheduledAt.getTime() - Date.now(),
    );
    await this.newsletterBroadcastQueue.add(
      NEWSLETTER_BROADCAST_MAIL_JOB,
      {
        broadcastId: broadcast.id,
        clientName: broadcast.clientName,
        subject: broadcast.subject,
        html: broadcast.html,
      },
      {
        jobId,
        delay,
        removeOnComplete: 500,
        attempts: 1,
      },
    );
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
