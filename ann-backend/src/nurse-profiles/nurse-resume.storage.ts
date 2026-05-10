import { createHash } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import * as path from 'path';

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
  const dir = path.join(
    params.uploadsRoot,
    NURSE_RESUMES_SEGMENT,
    params.folderSlug,
  );
  await mkdir(dir, { recursive: true });
  const hash = createHash('sha256')
    .update(params.buffer)
    .digest('hex')
    .slice(0, 16);
  const filename = `resume-${hash}.pdf`;
  const absolutePath = path.join(dir, filename);
  await writeFile(absolutePath, params.buffer);
  return {
    absolutePath,
    filename,
    publicPath: publicResumePath(params.folderSlug, filename),
  };
}

export async function deleteFileIfExists(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (e: unknown) {
    const code =
      e && typeof e === 'object' && 'code' in e
        ? (e as NodeJS.ErrnoException).code
        : undefined;
    if (code !== 'ENOENT') throw e;
  }
}
