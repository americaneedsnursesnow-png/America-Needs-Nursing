import { ConfigService } from '@nestjs/config';

function readTrimmed(config: ConfigService, key: string): string | undefined {
  const value = config.get<string | undefined>(key)?.trim();
  return value === undefined || value === '' ? undefined : value;
}

export function getConfigString(
  config: ConfigService,
  key: string,
  defaultValue: string,
): string {
  return readTrimmed(config, key) ?? defaultValue;
}

export function getOptionalConfigString(
  config: ConfigService,
  key: string,
): string | undefined {
  return readTrimmed(config, key);
}

/** Origin (scheme + host, no path) from a base URL string, or undefined if invalid. */
export function originFromPublicBaseUrl(
  raw: string | undefined,
): string | undefined {
  if (!raw) {
    return undefined;
  }
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return undefined;
  }
}

function mergeCorsWithFrontendUrl(
  origins: string[],
  frontendOrigin: string | undefined,
): string[] {
  if (!frontendOrigin) {
    return origins;
  }
  if (origins.includes(frontendOrigin)) {
    return origins;
  }
  return [...origins, frontendOrigin];
}

/**
 * Comma-separated `CORS_ORIGINS`. If unset or empty after parsing, returns `true`
 * (reflect request origin — OK for local dev only).
 * In `NODE_ENV=production`, require a non-empty allowlist: either set `CORS_ORIGINS`,
 * or set `FRONTEND_URL` (its origin is merged in and can satisfy production on its own
 * when `CORS_ORIGINS` is unset).
 */
export function getCorsOrigins(config: ConfigService): string[] | true {
  const raw = getOptionalConfigString(config, 'CORS_ORIGINS');
  const frontendOrigin = originFromPublicBaseUrl(
    getOptionalConfigString(config, 'FRONTEND_URL'),
  );
  const isProd =
    (config.get<string>('NODE_ENV')?.trim().toLowerCase() ?? '') ===
    'production';
  if (!raw) {
    if (isProd) {
      if (frontendOrigin) {
        return [frontendOrigin];
      }
      throw new Error(
        'CORS_ORIGINS must be set in production (comma-separated browser origins), or set FRONTEND_URL so that origin is allowed',
      );
    }
    return true;
  }
  const list = raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
  if (list.length === 0) {
    if (isProd) {
      if (frontendOrigin) {
        return [frontendOrigin];
      }
      throw new Error(
        'CORS_ORIGINS must list at least one origin in production, or set FRONTEND_URL so that origin is allowed',
      );
    }
    return true;
  }
  return mergeCorsWithFrontendUrl(list, frontendOrigin);
}

export function getConfigNumber(
  config: ConfigService,
  key: string,
  defaultValue: number,
  min = 0,
): number {
  const raw = readTrimmed(config, key);
  if (raw === undefined) {
    return defaultValue;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < min) {
    throw new Error(
      `${key} must be an integer greater than or equal to ${min}`,
    );
  }

  return parsed;
}

export function getConfigBoolean(
  config: ConfigService,
  key: string,
  defaultValue: boolean,
): boolean {
  const raw = readTrimmed(config, key);
  if (raw === undefined) {
    return defaultValue;
  }

  switch (raw.toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true;
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return false;
    default:
      throw new Error(
        `${key} must be a boolean-like value such as true/false or 1/0`,
      );
  }
}

export function buildRedisConnectionUrl(config: ConfigService): string {
  const explicitUrl = getOptionalConfigString(config, 'REDIS_URL');
  if (explicitUrl) {
    return explicitUrl;
  }

  const host = getConfigString(config, 'REDIS_HOST', 'localhost');
  const port = getConfigString(config, 'REDIS_PORT', '6379');
  const password = getOptionalConfigString(config, 'REDIS_PASSWORD');

  if (password) {
    return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
  }

  return `redis://${host}:${port}`;
}

/** ioredis/BullMQ worker options (requires `maxRetriesPerRequest: null` for workers). */
export function getRedisConnectionOptionsForBull(config: ConfigService): {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  maxRetriesPerRequest: null;
} {
  const urlStr = buildRedisConnectionUrl(config);
  const u = new URL(urlStr);
  const port = u.port ? Number.parseInt(u.port, 10) : 6379;
  const pathname = u.pathname?.replace(/^\//, '') ?? '';
  const db =
    pathname.length > 0 && /^\d+$/.test(pathname)
      ? Number.parseInt(pathname, 10)
      : undefined;

  const opts: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    db?: number;
    maxRetriesPerRequest: null;
  } = {
    host: u.hostname,
    port,
    maxRetriesPerRequest: null,
  };

  if (u.password) {
    opts.password = decodeURIComponent(u.password);
  }
  if (u.username) {
    opts.username = decodeURIComponent(u.username);
  }
  if (db !== undefined) {
    opts.db = db;
  }

  return opts;
}
