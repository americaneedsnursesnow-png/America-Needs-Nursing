import { createHash } from 'crypto';
import * as path from 'path';

import { getFileStorage } from '../storage/file-storage.registry';

export const NURSE_RESUMES_SEGMENT = 'nurse-resumes';

/** Public URL path prefix (served from ./uploads via Nest static /files). */
export const FILES_URL_PREFIX = '/files';

export function getUploadsRoot(): string {
  const raw = process.env.UPLOADS_DIR?.trim();
  return path.resolve(
    raw && raw.length > 0 ? raw : path.join(process.cwd(), 'uploads'),
  );
}

/**
 * One folder per nurse: slug from full name + short user id (avoids collisions when names repeat).
 */
export function nurseResumeFolderSlug(
  fullName: string | null | undefined,
  userId: string,
): string {
  const base = (fullName ?? 'nurse')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const safeBase = base.length > 0 ? base : 'nurse';
  const shortId = userId.replace(/-/g, '').slice(0, 8);
  return `${safeBase}-${shortId}`;
}

export function publicResumePath(folderSlug: string, filename: string): string {
  return `${FILES_URL_PREFIX}/${NURSE_RESUMES_SEGMENT}/${folderSlug}/${filename}`;
}

/**
 * Map stored public path (/files/nurse-resumes/...) to absolute file path under uploads root.
 */
export function resolveStoredResumeFile(
  uploadsRoot: string,
  resumeUrl: string | null | undefined,
): string | null {
  if (!resumeUrl?.startsWith(`${FILES_URL_PREFIX}/${NURSE_RESUMES_SEGMENT}/`)) {
    return null;
  }
  const relative = resumeUrl.slice(FILES_URL_PREFIX.length + 1);
  const resolved = path.resolve(uploadsRoot, relative);
  const rootResolved = path.resolve(uploadsRoot);
  const relToRoot = path.relative(rootResolved, resolved);
  if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
    return null;
  }
  return resolved;
}

export async function writeNurseResumePdf(params: {
  uploadsRoot: string;
  folderSlug: string;
  buffer: Buffer;
}): Promise<{ absolutePath: string; publicPath: string; filename: string }> {
  void params.uploadsRoot;
  const hash = createHash('sha256')
    .update(params.buffer)
    .digest('hex')
    .slice(0, 16);
  const filename = `resume-${hash}.pdf`;
  const objectKey = `${NURSE_RESUMES_SEGMENT}/${params.folderSlug}/${filename}`;
  const storage = getFileStorage();
  const publicPath = await storage.putObject({
    objectKey,
    buffer: params.buffer,
    contentType: 'application/pdf',
  });
  const absolutePath =
    localAbsolutePathFromKey(params.uploadsRoot, objectKey) ?? objectKey;
  return { absolutePath, filename, publicPath };
}

function localAbsolutePathFromKey(
  uploadsRoot: string,
  objectKey: string,
): string | null {
  const resolved = path.resolve(uploadsRoot, objectKey);
  const rootResolved = path.resolve(uploadsRoot);
  const rel = path.relative(rootResolved, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return null;
  }
  return resolved;
}

/** Delete by DB-stored path (`/files/...` or S3/CDN URL). */
export async function deleteStoredFile(
  storedUrl: string | null | undefined,
): Promise<void> {
  await getFileStorage().deleteByStoredUrl(storedUrl);
}

/** @deprecated Use deleteStoredFile with the public URL from the database. */
export async function deleteFileIfExists(filePath: string): Promise<void> {
  await deleteStoredFile(filePath);
}
