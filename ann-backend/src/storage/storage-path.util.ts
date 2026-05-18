import * as path from 'path';

import { FILES_URL_PREFIX } from '../nurse-profiles/nurse-resume.storage';

/** Object key under uploads root / S3 bucket (no `/files` prefix). */
export function objectKeyFromStoredUrl(
  storedUrl: string,
  publicBaseUrl?: string | null,
): string | null {
  const ref = storedUrl.trim();
  if (!ref) return null;

  if (ref.startsWith(`${FILES_URL_PREFIX}/`)) {
    return ref.slice(FILES_URL_PREFIX.length + 1);
  }

  if (/^https?:\/\//i.test(ref)) {
    try {
      const u = new URL(ref);
      const base = publicBaseUrl?.replace(/\/$/, '');
      if (base && ref.startsWith(`${base}/`)) {
        return u.pathname.replace(/^\//, '');
      }
      if (u.hostname.includes('.s3.') && u.hostname.endsWith('.amazonaws.com')) {
        return u.pathname.replace(/^\//, '');
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function localAbsolutePath(
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
