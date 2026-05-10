import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import * as path from 'path';
import {
  FILES_URL_PREFIX,
  getUploadsRoot,
} from '../nurse-profiles/nurse-resume.storage';

export { getUploadsRoot };

const SEGMENT = 'company-images';

export function safeCompanyClientFolder(clientName: string): string {
  const s = clientName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  return s.length > 0 ? s : 'default';
}

export function publicCompanyAssetPath(
  kind: 'logos' | 'heroes',
  clientFolder: string,
  filename: string,
): string {
  return `${FILES_URL_PREFIX}/${SEGMENT}/${kind}/${clientFolder}/${filename}`;
}

export function resolveStoredCompanyAssetFile(
  uploadsRoot: string,
  imageUrl: string | null | undefined,
  clientName: string,
  kind: 'logos' | 'heroes',
): string | null {
  const folder = safeCompanyClientFolder(clientName);
  const prefix = `${FILES_URL_PREFIX}/${SEGMENT}/${kind}/${folder}/`;
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

export async function writeCompanyImage(params: {
  uploadsRoot: string;
  clientName: string;
  kind: 'logos' | 'heroes';
  buffer: Buffer;
  ext: string;
}): Promise<{ absolutePath: string; publicPath: string; filename: string }> {
  const clientFolder = safeCompanyClientFolder(params.clientName);
  const dir = path.join(params.uploadsRoot, SEGMENT, params.kind, clientFolder);
  await mkdir(dir, { recursive: true });
  const hash = createHash('sha256')
    .update(params.buffer)
    .digest('hex')
    .slice(0, 12);
  const filename = `img-${hash}${params.ext}`;
  const absolutePath = path.join(dir, filename);
  await writeFile(absolutePath, params.buffer);
  return {
    absolutePath,
    filename,
    publicPath: publicCompanyAssetPath(params.kind, clientFolder, filename),
  };
}
