import { createHash } from 'crypto';
import * as path from 'path';
import {
  FILES_URL_PREFIX,
  getUploadsRoot,
} from '../nurse-profiles/nurse-resume.storage';
import { getFileStorage } from '../storage/file-storage.registry';

export { getUploadsRoot };

export const PROFILE_PHOTOS_SEGMENT = 'profile-photos';

export function publicProfilePhotoPath(
  userId: string,
  filename: string,
): string {
  return `${FILES_URL_PREFIX}/${PROFILE_PHOTOS_SEGMENT}/${userId}/${filename}`;
}

export function resolveStoredProfilePhotoFile(
  uploadsRoot: string,
  profilePhotoUrl: string | null | undefined,
): string | null {
  if (
    !profilePhotoUrl?.startsWith(
      `${FILES_URL_PREFIX}/${PROFILE_PHOTOS_SEGMENT}/`,
    )
  ) {
    return null;
  }
  const relative = profilePhotoUrl.slice(FILES_URL_PREFIX.length + 1);
  const resolved = path.resolve(uploadsRoot, relative);
  const rootResolved = path.resolve(uploadsRoot);
  const relToRoot = path.relative(rootResolved, resolved);
  if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
    return null;
  }
  return resolved;
}

export async function writeProfilePhoto(params: {
  uploadsRoot: string;
  userId: string;
  buffer: Buffer;
  ext: string;
  contentType: string;
  /** File basename prefix (default `photo`; use `banner` for profile banners). */
  basenamePrefix?: string;
}): Promise<{ absolutePath: string; publicPath: string; filename: string }> {
  void params.uploadsRoot;
  const hash = createHash('sha256')
    .update(params.buffer)
    .digest('hex')
    .slice(0, 12);
  const prefix = params.basenamePrefix ?? 'photo';
  const filename = `${prefix}-${hash}${params.ext}`;
  const objectKey = `${PROFILE_PHOTOS_SEGMENT}/${params.userId}/${filename}`;
  const publicPath = await getFileStorage().putObject({
    objectKey,
    buffer: params.buffer,
    contentType: params.contentType,
  });
  return {
    absolutePath: path.join(params.uploadsRoot, objectKey),
    filename,
    publicPath,
  };
}
