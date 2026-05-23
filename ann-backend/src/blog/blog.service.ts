import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import {
  buildPaginatedMeta,
  normalizePagination,
  type PaginatedResult,
} from '../common/types/paginated';
import { sanitizeBlogRichHtml } from '../common/html/sanitize-stored-html';
import { detectImage } from '../common/image-detect';
import { uniqueSlugFromTitle } from '../common/slug.util';
import { BlogPost, BlogPostStatus } from '../database/entities';
import {
  BLOG_PUBLISH_MAIL_JOB,
  BLOG_PUBLISH_MAIL_QUEUE,
} from '../queues/queue.constants';
import { deleteFileIfExists } from '../nurse-profiles/nurse-resume.storage';
import {
  getUploadsRoot,
  resolveStoredBlogImageFile,
  writeBlogImage,
} from './blog-image.storage';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

const BLOG_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Multer memoryStorage file shape. */
export type BlogImageUploadFile = {
  buffer: Buffer;
  size: number;
  mimetype: string;
};

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    @InjectRepository(BlogPost)
    private readonly blogRepository: Repository<BlogPost>,
    @InjectQueue(BLOG_PUBLISH_MAIL_QUEUE)
    private readonly blogPublishMailQueue: Queue,
  ) {}

  async create(
    user: JwtUserPayload,
    dto: CreateBlogPostDto,
  ): Promise<BlogPost> {
    const slug = await this.resolveNewBlogSlug(
      user.clientName,
      dto.title,
      dto.slug?.trim() ?? '',
    );
    const saved = await this.blogRepository.save(
      this.blogRepository.create({
        clientName: user.clientName,
        title: dto.title.trim(),
        slug,
        body: sanitizeBlogRichHtml(dto.body),
        coverImageUrl: dto.coverImageUrl?.trim() ?? null,
        excerpt: dto.excerpt?.trim() ?? null,
        metaTitle: dto.metaTitle?.trim() ?? null,
        metaDescription: dto.metaDescription?.trim() ?? null,
        sponsored: dto.sponsored ?? false,
        status: dto.status,
        publishedAt:
          dto.status === BlogPostStatus.PUBLISHED
            ? (dto.publishedAt ?? new Date())
            : null,
      }),
    );

    if (saved.status === BlogPostStatus.PUBLISHED) {
      await this.enqueueBlogPublishMail(saved.id).catch((err: unknown) => {
        this.logger.error(
          'enqueueBlogPublishMail failed',
          err instanceof Error ? err.stack : String(err),
        );
      });
    }

    return saved;
  }

  async update(
    user: JwtUserPayload,
    id: string,
    dto: UpdateBlogPostDto,
  ): Promise<BlogPost> {
    const post = await this.blogRepository.findOne({
      where: { id, clientName: user.clientName },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const wasPublished = post.status === BlogPostStatus.PUBLISHED;

    if (dto.title !== undefined) post.title = dto.title.trim();
    if (dto.body !== undefined) post.body = sanitizeBlogRichHtml(dto.body);
    let oldCoverPath: string | null = null;
    if (dto.coverImageUrl !== undefined) {
      const next = dto.coverImageUrl?.trim() ?? null;
      if (next !== post.coverImageUrl) {
        oldCoverPath = resolveStoredBlogImageFile(
          getUploadsRoot(),
          post.coverImageUrl,
          user.clientName,
        );
        post.coverImageUrl = next;
      }
    }
    if (dto.excerpt !== undefined) post.excerpt = dto.excerpt?.trim() ?? null;
    if (dto.metaTitle !== undefined) {
      post.metaTitle = dto.metaTitle?.trim() ?? null;
    }
    if (dto.metaDescription !== undefined) {
      post.metaDescription = dto.metaDescription?.trim() ?? null;
    }
    if (dto.sponsored !== undefined) post.sponsored = dto.sponsored;
    if (dto.status !== undefined) {
      post.status = dto.status;
      if (dto.status === BlogPostStatus.PUBLISHED && !post.publishedAt) {
        post.publishedAt = dto.publishedAt ?? new Date();
      }
      if (dto.status === BlogPostStatus.DRAFT) {
        post.publishedAt = dto.publishedAt ?? null;
      }
    } else if (dto.publishedAt !== undefined) {
      post.publishedAt = dto.publishedAt;
    }

    const saved = await this.blogRepository.save(post);

    if (oldCoverPath) {
      await deleteFileIfExists(oldCoverPath);
    }

    if (!wasPublished && saved.status === BlogPostStatus.PUBLISHED) {
      await this.enqueueBlogPublishMail(saved.id).catch((err: unknown) => {
        this.logger.error(
          'enqueueBlogPublishMail failed',
          err instanceof Error ? err.stack : String(err),
        );
      });
    }

    return saved;
  }

  async delete(user: JwtUserPayload, id: string): Promise<void> {
    const post = await this.blogRepository.findOne({
      where: { id, clientName: user.clientName },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const coverImageUrl = post.coverImageUrl;
    await this.blogRepository.remove(post);
    if (coverImageUrl) {
      const coverPath = resolveStoredBlogImageFile(
        getUploadsRoot(),
        coverImageUrl,
        user.clientName,
      );
      if (coverPath) {
        await deleteFileIfExists(coverPath);
      }
    }
  }

  private async enqueueBlogPublishMail(postId: string): Promise<void> {
    await this.blogPublishMailQueue.add(
      BLOG_PUBLISH_MAIL_JOB,
      { postId },
      {
        jobId: `blog-publish-mail-${postId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        delay: 3000,
      },
    );
    this.logger.log(`Blog publish mail job queued for post ${postId}`);
  }

  private async resolveNewBlogSlug(
    clientName: string,
    title: string,
    requested: string,
  ): Promise<string> {
    if (requested.length > 0) {
      const slug = requested.toLowerCase().slice(0, 200);
      const dup = await this.blogRepository.exist({
        where: { clientName, slug },
      });
      if (dup) {
        throw new ConflictException('Slug already in use');
      }
      return slug;
    }
    const t = title.trim();
    for (let i = 0; i < 24; i++) {
      const slug = uniqueSlugFromTitle(t).slice(0, 200);
      const dup = await this.blogRepository.exist({
        where: { clientName, slug },
      });
      if (!dup) {
        return slug;
      }
    }
    throw new ConflictException('Could not allocate a unique post URL');
  }

  async listAdmin(user: JwtUserPayload): Promise<BlogPost[]> {
    return this.blogRepository.find({
      where: { clientName: user.clientName },
      order: { createdAt: 'DESC' },
    });
  }

  async uploadBlogImage(
    user: JwtUserPayload,
    file: BlogImageUploadFile,
  ): Promise<{ url: string }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Image file is required');
    }
    if (file.size > BLOG_IMAGE_MAX_BYTES) {
      throw new BadRequestException('Image must be 5 MB or smaller');
    }
    const mime = (file.mimetype ?? '').toLowerCase();
    const mimeOk =
      mime === 'image/jpeg' ||
      mime === 'image/jpg' ||
      mime === 'image/pjpeg' ||
      mime === 'image/png' ||
      mime === 'image/webp' ||
      mime === 'application/octet-stream';
    const detected = detectImage(file.buffer);
    if (!mimeOk || !detected) {
      throw new BadRequestException(
        'Only JPEG, PNG, or WebP images are allowed',
      );
    }
    const uploadsRoot = getUploadsRoot();
    const { publicPath } = await writeBlogImage({
      uploadsRoot,
      clientName: user.clientName,
      buffer: file.buffer,
      ext: detected.ext,
    });
    return { url: publicPath };
  }

  async listPublishedPublic(
    clientName: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<BlogPost>> {
    const { skip, limit: lim, page: p } = normalizePagination(page, limit);
    const where = {
      clientName,
      status: BlogPostStatus.PUBLISHED,
    };
    const totalItems = await this.blogRepository.count({ where });
    const items = await this.blogRepository.find({
      where,
      order: { publishedAt: 'DESC' },
      skip,
      take: lim,
    });
    return {
      items,
      meta: buildPaginatedMeta(totalItems, p, lim),
    };
  }

  async getPublishedBySlugPublic(
    clientName: string,
    slug: string,
  ): Promise<BlogPost> {
    const post = await this.blogRepository.findOne({
      where: {
        clientName,
        slug: slug.trim().toLowerCase(),
        status: BlogPostStatus.PUBLISHED,
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }
}
