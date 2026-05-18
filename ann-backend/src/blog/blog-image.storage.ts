import { createHash } from 'crypto';
import * as path from 'path';
import {
  FILES_URL_PREFIX,
  getUploadsRoot,
} from '../nurse-profiles/nurse-resume.storage';
import { getFileStorage } from '../storage/file-storage.registry';

export { getUploadsRoot };

export const BLOG_IMAGES_SEGMENT = 'blog-images';

export function safeBlogClientFolder(clientName: string): string {
  const s = clientName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  return s.length > 0 ? s : 'default';
}

export function publicBlogImagePath(
  clientFolder: string,
  filename: string,
): string {
  return `${FILES_URL_PREFIX}/${BLOG_IMAGES_SEGMENT}/${clientFolder}/${filename}`;
}

export function resolveStoredBlogImageFile(
  uploadsRoot: string,
  imageUrl: string | null | undefined,
  clientName: string,
): string | null {
  const folder = safeBlogClientFolder(clientName);
  const prefix = `${FILES_URL_PREFIX}/${BLOG_IMAGES_SEGMENT}/${folder}/`;
  if (!imageUrl?.startsWith(prefix)) {
    return null;
  }
  const relative = imageUrl.slice(FILES_URL_PREFIX.length + 1);
  const resolved = path.resolve(uploadsRoot, relative);
  const rootResolved = path.resolve(uploadsRoot);
  const relToRoot = path.relative(rootResolved, resolved);
  if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
    return null;
  }
  return resolved;
}

export async function writeBlogImage(params: {
  uploadsRoot: string;
  clientName: string;
  buffer: Buffer;
  ext: string;
  contentType: string;
}): Promise<{ absolutePath: string; publicPath: string; filename: string }> {
  const clientFolder = safeBlogClientFolder(params.clientName);
  const hash = createHash('sha256')
    .update(params.buffer)
    .digest('hex')
    .slice(0, 12);
  const filename = `img-${hash}${params.ext}`;
  const objectKey = `${BLOG_IMAGES_SEGMENT}/${clientFolder}/${filename}`;
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
