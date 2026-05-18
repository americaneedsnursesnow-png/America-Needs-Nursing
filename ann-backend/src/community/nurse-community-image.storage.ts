import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { randomUUID } from 'node:crypto';
import { diskStorage } from 'multer';
import type { FileFilterCallback } from 'multer';
import type { Request } from 'express';

import { getUploadsRoot } from '../nurse-profiles/nurse-resume.storage';
import { getFileStorage } from '../storage/file-storage.registry';

const UPLOAD_SUBDIR = 'nurse-communities';

function uploadRoot(): string {
  const dir = join(getUploadsRoot(), UPLOAD_SUBDIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function safeExt(mime: string | undefined): string {
  if (mime === 'image/png') {
    return 'png';
  }
  if (mime === 'image/webp') {
    return 'webp';
  }
  return 'jpg';
}

export const nurseCommunityImageStorage = diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (e: Error | null, p: string) => void,
  ) => {
    cb(null, uploadRoot());
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (e: Error | null, p: string) => void,
  ) => {
    const ext = safeExt(file.mimetype);
    cb(null, `${randomUUID()}.${ext}`);
  },
});

export const nurseCommunityImageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  const ok =
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/pjpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/webp' ||
    file.mimetype === 'application/octet-stream';
  if (!ok) {
    cb(new Error('Only JPEG, PNG, or WebP images are allowed'));
    return;
  }
  cb(null, true);
};

export const NURSE_COMMUNITIES_SEGMENT = 'nurse-communities';

export function publicUrlForNurseCommunityImage(filename: string): string {
  return `/files/${NURSE_COMMUNITIES_SEGMENT}/${filename}`;
}

export async function writeNurseCommunityImage(params: {
  communityId: string;
  buffer: Buffer;
  ext: string;
  contentType: string;
}): Promise<{ publicPath: string; filename: string }> {
  const name = `${params.communityId.replace(/-/g, '')}-${Date.now()}${params.ext}`;
  const objectKey = `${NURSE_COMMUNITIES_SEGMENT}/${name}`;
  const publicPath = await getFileStorage().putObject({
    objectKey,
    buffer: params.buffer,
    contentType: params.contentType,
  });
  return { publicPath, filename: name };
}
