import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import {
  BlogPost,
  BlogPostStatus,
} from '../database/entities';
import { BLOG_PUBLISH_MAIL_QUEUE } from '../queues/queue.constants';
import { BlogPublishNotificationsService } from './blog-publish-notifications.service';

export type BlogPublishMailJobData = {
  postId: string;
};

@Processor(BLOG_PUBLISH_MAIL_QUEUE, { concurrency: 2 })
export class BlogPublishMailProcessor extends WorkerHost {
  private readonly logger = new Logger(BlogPublishMailProcessor.name);

  constructor(
    @InjectRepository(BlogPost)
    private readonly blogRepository: Repository<BlogPost>,
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

    // Check if the post is scheduled and publish it
    const post = await this.blogRepository.findOne({
      where: { id: postId },
    });
    if (!post) {
      this.logger.warn(`Blog post ${postId} not found`);
      return;
    }

    if (post.status === BlogPostStatus.SCHEDULED) {
      // Transition scheduled post to published
      post.status = BlogPostStatus.PUBLISHED;
      post.publishedAt = post.publishedAt ?? new Date();
      post.scheduledAt = null;
      await this.blogRepository.save(post);
      this.logger.log(`Blog post ${postId} auto-published from scheduled status`);
    } else if (post.status !== BlogPostStatus.PUBLISHED) {
      this.logger.warn(
        `Blog post ${postId} is ${post.status}; skipping publish notifications`,
      );
      return;
    } else if (String(job.id ?? '') === `blog-publish-${postId}`) {
      this.logger.warn(
        `Stale scheduled blog job for already-published post ${postId}; skipping duplicate notifications`,
      );
      return;
    }

    await this.blogPublishNotifications.sendPublishedPostToNewsletterSubscribers(
      postId,
    );
  }
}
