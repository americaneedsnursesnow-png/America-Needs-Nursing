import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import * as path from 'path';
import type { Readable } from 'stream';

import {
  FILES_URL_PREFIX,
  getUploadsRoot,
} from '../nurse-profiles/nurse-resume.storage';
import { localAbsolutePath, objectKeyFromStoredUrl } from './storage-path.util';
import { resolveS3BucketName } from './s3-public-url.util';

export type StorageDriver = 'local' | 's3';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  readonly driver: StorageDriver;
  private readonly uploadsRoot: string;
  private readonly s3Client: S3Client | null;
  private readonly bucket: string | null;
  private readonly publicBaseUrl: string | null;

  constructor(private readonly config: ConfigService) {
    const driverRaw =
      this.config.get<string>('STORAGE_DRIVER')?.trim().toLowerCase() ?? 'local';
    this.driver = driverRaw === 's3' ? 's3' : 'local';
    this.uploadsRoot = getUploadsRoot();
    this.publicBaseUrl =
      this.config.get<string>('S3_PUBLIC_BASE_URL')?.trim().replace(/\/$/, '') ||
      null;

    if (this.driver === 's3') {
      const bucket = resolveS3BucketName((key) =>
        this.config.get<string>(key),
      );
      const region =
        this.config.get<string>('AWS_REGION')?.trim() ||
        this.config.get<string>('AWS_SES_REGION')?.trim() ||
        'us-east-1';
      if (!bucket) {
        throw new Error(
          'STORAGE_DRIVER=s3 requires S3_BUCKET or AWS_S3_BUCKET_NAME',
        );
      }
      this.bucket = bucket;
      const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID')?.trim();
      const secretAccessKey = this.config
        .get<string>('AWS_SECRET_ACCESS_KEY')
        ?.trim();
      this.s3Client = new S3Client({
        region,
        credentials:
          accessKeyId && secretAccessKey
            ? { accessKeyId, secretAccessKey }
            : undefined,
      });
      this.logger.log(`File storage: S3 bucket ${bucket} (${region})`);
    } else {
      this.bucket = null;
      this.s3Client = null;
      this.logger.log(`File storage: local disk (${this.uploadsRoot})`);
    }
  }

  isLocalDriver(): boolean {
    return this.driver === 'local';
  }

  getPublicBaseUrl(): string | null {
    return this.publicBaseUrl;
  }

  /** Public URL stored in DB (`/files/...` locally, https URL on S3). */
  publicUrlForObjectKey(objectKey: string): string {
    if (this.driver === 'local') {
      return `${FILES_URL_PREFIX}/${objectKey}`;
    }
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${objectKey}`;
    }
    const region =
      this.config.get<string>('AWS_REGION')?.trim() ||
      this.config.get<string>('AWS_SES_REGION')?.trim() ||
      'us-east-1';
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${objectKey}`;
  }

  async putObject(params: {
    objectKey: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<string> {
    const key = params.objectKey.replace(/^\/+/, '');
    if (this.driver === 'local') {
      const abs = localAbsolutePath(this.uploadsRoot, key);
      if (!abs) {
        throw new Error('Invalid storage key');
      }
      await mkdir(path.dirname(abs), { recursive: true });
      await writeFile(abs, params.buffer);
      return this.publicUrlForObjectKey(key);
    }

    if (!this.s3Client || !this.bucket) {
      throw new Error('S3 storage is not configured');
    }
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: params.buffer,
        ContentType: params.contentType,
      }),
    );
    return this.publicUrlForObjectKey(key);
  }

  async deleteByStoredUrl(storedUrl: string | null | undefined): Promise<void> {
    const key = objectKeyFromStoredUrl(storedUrl ?? '', this.publicBaseUrl);
    if (!key) return;

    if (this.driver === 'local') {
      const abs = localAbsolutePath(this.uploadsRoot, key);
      if (!abs) return;
      try {
        await unlink(abs);
      } catch (e: unknown) {
        const code =
          e && typeof e === 'object' && 'code' in e
            ? (e as NodeJS.ErrnoException).code
            : undefined;
        if (code !== 'ENOENT') throw e;
      }
      return;
    }

    if (!this.s3Client || !this.bucket) return;
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`S3 delete failed for ${key}: ${msg}`);
    }
  }

  async getReadStream(
    storedUrl: string,
    filename = 'download',
  ): Promise<{ stream: Readable; filename: string }> {
    const key = objectKeyFromStoredUrl(storedUrl, this.publicBaseUrl);
    if (!key) {
      throw new Error('Unsupported file reference');
    }

    if (this.driver === 'local') {
      const abs = localAbsolutePath(this.uploadsRoot, key);
      if (!abs || !existsSync(abs)) {
        throw new Error('File missing');
      }
      return { stream: createReadStream(abs), filename };
    }

    if (!this.s3Client || !this.bucket) {
      throw new Error('S3 storage is not configured');
    }
    const out = await this.s3Client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!out.Body) {
      throw new Error('File missing');
    }
    return {
      stream: out.Body as Readable,
      filename: path.basename(key) || filename,
    };
  }

  /** Whether a blog image src is from this app (local `/files` or configured S3/CDN). */
  isTrustedBlogImageSrc(src: string): boolean {
    const t = src.trim();
    if (!t || /^javascript:/i.test(t) || /^data:/i.test(t)) {
      return false;
    }
    if (t.startsWith(`${FILES_URL_PREFIX}/blog-images/`)) {
      return true;
    }
    const key = objectKeyFromStoredUrl(t, this.publicBaseUrl);
    return key != null && key.startsWith('blog-images/');
  }
}
