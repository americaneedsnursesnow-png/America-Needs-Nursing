/**
 * Upload local `UPLOADS_DIR` files to S3 and optionally rewrite DB `/files/...` URLs.
 *
 * Usage:
 *   npm run storage:migrate-s3 -- --dry-run
 *   npm run storage:migrate-s3 -- --update-db
 *   npm run storage:migrate-s3 -- --show-layout
 *
 * Requires in ann-backend/.env:
 *   S3_BUCKET or AWS_S3_BUCKET_NAME, AWS_REGION (or AWS_SES_REGION), AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   Optional: S3_PUBLIC_BASE_URL=https://cdn.example.com
 */
import { config } from 'dotenv';
import { createReadStream } from 'fs';
import { readdir, stat } from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { DataSource } from 'typeorm';

import { FILES_URL_PREFIX, getUploadsRoot } from '../nurse-profiles/nurse-resume.storage';
import {
  contentTypeFromFilename,
  mapFilesPathToS3Url,
  publicUrlForObjectKey,
  readS3EnvFromProcess,
} from '../storage/s3-public-url.util';
import {
  UPLOADS_DB_COLUMNS,
  UPLOADS_FOLDER_LAYOUT,
} from '../storage/uploads-layout';

config();

type CliArgs = {
  dryRun: boolean;
  updateDb: boolean;
  skipExisting: boolean;
  showLayout: boolean;
  rewriteBlogBody: boolean;
};

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  return {
    dryRun: argv.includes('--dry-run'),
    updateDb: argv.includes('--update-db'),
    skipExisting: argv.includes('--skip-existing'),
    showLayout: argv.includes('--show-layout') || argv.includes('--help'),
    rewriteBlogBody: argv.includes('--rewrite-blog-body'),
  };
}

async function walkFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs);
      } else if (entry.isFile()) {
        out.push(abs);
      }
    }
  }
  await walk(root);
  return out;
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (c: Buffer) => chunks.push(c));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function objectExists(
  client: S3Client,
  bucket: string,
  key: string,
): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

function createDataSource(): DataSource {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    return new DataSource({ type: 'postgres', url });
  }
  return new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST?.trim() || 'localhost',
    port: parseInt(process.env.DATABASE_PORT?.trim() || '5432', 10),
    username: process.env.DATABASE_USER?.trim() || 'postgres',
    password: process.env.DATABASE_PASSWORD?.trim() || '',
    database: process.env.DATABASE_NAME?.trim() || 'postgres',
  });
}

async function updateDbUrls(
  s3Config: ReturnType<typeof readS3EnvFromProcess>,
  dryRun: boolean,
  rewriteBlogBody: boolean,
): Promise<void> {
  const ds = createDataSource();
  await ds.initialize();
  try {
    let total = 0;
    for (const { table, column } of UPLOADS_DB_COLUMNS) {
      const rows = (await ds.query(
        `SELECT id, "${column}" AS url FROM ${table} WHERE "${column}" IS NOT NULL AND "${column}" LIKE $1`,
        [`${FILES_URL_PREFIX}/%`],
      )) as Array<{ id: string; url: string }>;

      for (const row of rows) {
        const next = mapFilesPathToS3Url(row.url, s3Config);
        if (!next || next === row.url) continue;
        total += 1;
        if (dryRun) {
          console.log(`[db] ${table}.${column} ${row.id}: ${row.url} → ${next}`);
        } else {
          await ds.query(
            `UPDATE ${table} SET "${column}" = $1 WHERE id = $2`,
            [next, row.id],
          );
        }
      }
    }

    if (rewriteBlogBody) {
      const posts = (await ds.query(
        `SELECT id, body FROM blog_posts WHERE body LIKE $1`,
        [`%${FILES_URL_PREFIX}/blog-images/%`],
      )) as Array<{ id: string; body: string }>;

      for (const post of posts) {
        let body = post.body;
        const prefix = `${FILES_URL_PREFIX}/blog-images/`;
        let idx = body.indexOf(prefix);
        while (idx !== -1) {
          const end = body.indexOf('"', idx);
          const end2 = body.indexOf("'", idx);
          const stop =
            end === -1
              ? end2
              : end2 === -1
                ? end
                : Math.min(end, end2);
          if (stop === -1) break;
          const localPath = body.slice(idx, stop);
          const mapped = mapFilesPathToS3Url(localPath, s3Config);
          if (mapped) {
            body = body.slice(0, idx) + mapped + body.slice(stop);
            idx = body.indexOf(prefix, idx + mapped.length);
          } else {
            idx = body.indexOf(prefix, idx + 1);
          }
        }
        if (body !== post.body) {
          total += 1;
          if (dryRun) {
            console.log(`[db] blog_posts.body ${post.id}: embedded /files/ URLs updated`);
          } else {
            await ds.query(`UPDATE blog_posts SET body = $1 WHERE id = $2`, [
              body,
              post.id,
            ]);
          }
        }
      }
    }

    console.log(
      dryRun
        ? `DB: ${total} row(s) would be updated (re-run with --update-db).`
        : `DB: updated ${total} row(s).`,
    );
  } finally {
    await ds.destroy();
  }
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.showLayout && !args.dryRun && !args.updateDb) {
    console.log(UPLOADS_FOLDER_LAYOUT);
    console.log('\nDatabase columns that store file URLs:\n');
    for (const col of UPLOADS_DB_COLUMNS) {
      console.log(`  ${col.table}.${col.column} — ${col.description}`);
    }
    console.log(
      '\nOptions:\n' +
        '  --dry-run           List uploads + DB changes without writing\n' +
        '  --skip-existing     Skip S3 keys that already exist\n' +
        '  --update-db         Rewrite /files/... columns to S3/CDN URLs\n' +
        '  --rewrite-blog-body Replace /files/blog-images/ inside blog_posts.body HTML',
    );
    return;
  }

  const uploadsRoot = getUploadsRoot();
  const s3Config = readS3EnvFromProcess();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  const s3 = new S3Client({
    region: s3Config.region,
    credentials:
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
  });

  console.log(`Local uploads root: ${uploadsRoot}`);
  console.log(`S3 bucket: ${s3Config.bucket} (${s3Config.region})`);
  if (s3Config.publicBaseUrl) {
    console.log(`Public base: ${s3Config.publicBaseUrl}`);
  }

  const files = await walkFiles(uploadsRoot);
  if (files.length === 0) {
    console.log('No files found under uploads root.');
  }

  let uploaded = 0;
  let skipped = 0;

  for (const abs of files) {
    const objectKey = path.relative(uploadsRoot, abs).split(path.sep).join('/');
    const contentType = contentTypeFromFilename(path.basename(abs));
    const publicUrl = publicUrlForObjectKey(objectKey, s3Config);

    if (args.skipExisting && !args.dryRun) {
      const exists = await objectExists(s3, s3Config.bucket, objectKey);
      if (exists) {
        skipped += 1;
        console.log(`skip (exists): ${objectKey}`);
        continue;
      }
    }

    if (args.dryRun) {
      console.log(`upload: ${objectKey} → ${publicUrl} (${contentType})`);
      uploaded += 1;
      continue;
    }

    const body = await streamToBuffer(createReadStream(abs));
    await s3.send(
      new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
      }),
    );
    uploaded += 1;
    console.log(`uploaded: ${objectKey}`);
  }

  console.log(
    `\nFiles: ${uploaded} ${args.dryRun ? 'would be uploaded' : 'uploaded'}, ${skipped} skipped.`,
  );

  if (args.updateDb) {
    await updateDbUrls(s3Config, args.dryRun, args.rewriteBlogBody);
  } else if (!args.dryRun) {
    console.log(
      'Tip: run with --update-db to rewrite database /files/... URLs to S3.',
    );
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
