import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BlogPost,
  BlogPostStatus,
  NewsletterSubscriber,
} from '../database/entities';
import { uniqueEmailRecipients } from '../mail/email-recipients.util';
import {
  normaliseFrontendBase,
  renderBlogPublishEmail,
} from '../mail/email-layouts';
import { MailService } from '../mail/mail.service';

/**
 * Sends “new blog post” email to active newsletter subscribers for the post’s tenant.
 * Invoked from the BullMQ worker so HTTP handlers stay fast.
 */
@Injectable()
export class BlogPublishNotificationsService {
  private readonly logger = new Logger(BlogPublishNotificationsService.name);

  constructor(
    @InjectRepository(BlogPost)
    private readonly blogRepository: Repository<BlogPost>,
    @InjectRepository(NewsletterSubscriber)
    private readonly subscribersRepository: Repository<NewsletterSubscriber>,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async sendPublishedPostToNewsletterSubscribers(
    postId: string,
  ): Promise<void> {
    const post = await this.blogRepository.findOne({ where: { id: postId } });
    if (!post) {
      this.logger.warn(`Blog post ${postId} not found; skip mail job`);
      return;
    }
    if (post.status !== BlogPostStatus.PUBLISHED) {
      this.logger.warn(`Blog post ${postId} is not published; skip mail job`);
      return;
    }

    const subs = await this.subscribersRepository.find({
      where: { clientName: post.clientName, active: true },
      select: ['email'],
    });
    const emails = uniqueEmailRecipients(
      subs.map((s) => s.email).filter(Boolean),
    );
    if (emails.length === 0) {
      this.logger.log(
        `No active newsletter subscribers for client ${post.clientName}; skip blog mail`,
      );
      return;
    }

    if (!this.mailService.isEnabled()) {
      this.logger.warn(
        'Blog publish job ran but SMTP not configured — subscribers not emailed',
      );
      return;
    }

    const subject = `New article: ${post.title}`;
    const excerpt =
      post.excerpt?.trim() ||
      post.body.slice(0, 200).replace(/\s+/g, ' ').trim() + '…';
    const frontendBase = normaliseFrontendBase(
      this.config.get<string>('FRONTEND_URL'),
    );
    const html = renderBlogPublishEmail({
      title: post.title,
      excerpt,
      slug: post.slug,
      coverImageUrl: post.coverImageUrl,
      frontendBase,
    });

    await this.mailService.sendBulkBcc(emails, subject, html);
    this.logger.log(
      `Blog publish notification sent to ${emails.length} newsletter subscriber(s) for post ${postId}`,
    );
  }
}
