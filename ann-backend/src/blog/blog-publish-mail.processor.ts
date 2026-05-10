import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BLOG_PUBLISH_MAIL_QUEUE } from '../queues/queue.constants';
import { BlogPublishNotificationsService } from './blog-publish-notifications.service';

export type BlogPublishMailJobData = {
  postId: string;
};

@Processor(BLOG_PUBLISH_MAIL_QUEUE, { concurrency: 2 })
export class BlogPublishMailProcessor extends WorkerHost {
  private readonly logger = new Logger(BlogPublishMailProcessor.name);

  constructor(
    private readonly blogPublishNotifications: BlogPublishNotificationsService,
  ) {
    super();
  }

  async process(job: Job<BlogPublishMailJobData>): Promise<void> {
    const postId = job.data?.postId;
    if (!postId) {
      this.logger.warn('blog-publish-mail job missing postId');
      return;
    }
    await this.blogPublishNotifications.sendPublishedPostToNewsletterSubscribers(
      postId,
    );
  }
}
