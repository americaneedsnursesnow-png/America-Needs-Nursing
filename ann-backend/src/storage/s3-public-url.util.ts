import { FILES_URL_PREFIX } from '../nurse-profiles/nurse-resume.storage';

export type S3EnvConfig = {
  bucket: string;
  region: string;
  publicBaseUrl: string | null;
};

/** `S3_BUCKET` is canonical; `AWS_S3_BUCKET_NAME` is accepted as an alias. */
export function resolveS3BucketName(
  lookup: (key: string) => string | undefined,
): string | undefined {
  return (
    lookup('S3_BUCKET')?.trim() || lookup('AWS_S3_BUCKET_NAME')?.trim() || undefined
  );
}

export function readS3EnvFromProcess(): S3EnvConfig {
  const bucket = resolveS3BucketName((k) => process.env[k]);
  if (!bucket) {
    throw new Error('S3_BUCKET or AWS_S3_BUCKET_NAME is required');
  }
  const region =
    process.env.AWS_REGION?.trim() ||
    process.env.AWS_SES_REGION?.trim() ||
    'us-east-1';
  const publicBaseUrl =
    process.env.S3_PUBLIC_BASE_URL?.trim().replace(/\/$/, '') || null;
  return { bucket, region, publicBaseUrl };
}

/** HTTPS (or CDN) URL stored in the database after migration. */
export function publicUrlForObjectKey(
  objectKey: string,
  config: S3EnvConfig,
): string {
  const key = objectKey.replace(/^\/+/, '');
  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl}/${key}`;
  }
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
}

/** Map `/files/nurse-resumes/...` → S3/CDN URL; returns null if not a local files path. */
export function mapFilesPathToS3Url(
  storedUrl: string,
  config: S3EnvConfig,
): string | null {
  const ref = storedUrl.trim();
  if (!ref.startsWith(`${FILES_URL_PREFIX}/`)) {
    return null;
  }
  const key = ref.slice(FILES_URL_PREFIX.length + 1);
  return publicUrlForObjectKey(key, config);
}

export function contentTypeFromFilename(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}
