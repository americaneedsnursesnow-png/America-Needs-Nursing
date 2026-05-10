import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { RedisClientType } from '@keyv/redis';
import {
  DEFAULT_RATE_LIMIT_POLICY,
  RATE_LIMIT_REDIS,
} from './rate-limit.constants';
import { RateLimitConfigService } from './rate-limit-config.service';
import type {
  RateLimitDecision,
  RateLimitPolicy,
  RateLimitPolicyName,
  RateLimitTracker,
} from './rate-limit.types';

type JwtRateLimitPayload = {
  sub?: string;
  typ?: string;
};

type RequestWithRoute = Omit<Request, 'route'> & {
  route?: {
    path?: string;
  };
};

const RATE_LIMIT_LUA = `
local limit = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local blockAfterViolations = tonumber(ARGV[3])
local blockDurationMs = tonumber(ARGV[4])
local violationWindowMs = tonumber(ARGV[5])
local captchaEnabled = tonumber(ARGV[6])
local captchaAfterViolations = tonumber(ARGV[7])
local captchaTtlMs = tonumber(ARGV[8])

local blockTtl = redis.call('PTTL', KEYS[3])
local captchaTtl = redis.call('PTTL', KEYS[4])

if blockTtl > 0 then
  local violations = tonumber(redis.call('GET', KEYS[2]) or '0')
  local captchaRequired = captchaTtl > 0 and 1 or 0
  return {0, 1, limit, 0, blockTtl, blockTtl, violations, captchaRequired}
end

redis.call('SET', KEYS[1], 0, 'PX', windowMs, 'NX')
local currentHits = tonumber(redis.call('INCR', KEYS[1]))
local windowTtl = redis.call('PTTL', KEYS[1])

if currentHits <= limit then
  local remainingHits = limit - currentHits
  local captchaRequired = captchaTtl > 0 and 1 or 0
  local violations = tonumber(redis.call('GET', KEYS[2]) or '0')
  return {1, 0, currentHits, remainingHits, 0, windowTtl, violations, captchaRequired}
end

redis.call('SET', KEYS[2], 0, 'PX', violationWindowMs, 'NX')
local violations = tonumber(redis.call('INCR', KEYS[2]))
local captchaRequired = captchaTtl > 0 and 1 or 0

if captchaEnabled == 1 and violations >= captchaAfterViolations then
  redis.call('SET', KEYS[4], violations, 'PX', captchaTtlMs)
  captchaRequired = 1
end

local blocked = 0
blockTtl = 0
if blockAfterViolations > 0 and violations >= blockAfterViolations then
  redis.call('SET', KEYS[3], violations, 'PX', blockDurationMs)
  blockTtl = redis.call('PTTL', KEYS[3])
  blocked = 1
end

local retryAfter = windowTtl
if blocked == 1 and blockTtl > retryAfter then
  retryAfter = blockTtl
end

return {0, blocked, currentHits, 0, retryAfter, windowTtl, violations, captchaRequired}
`;

@Injectable()
export class RateLimitService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private scriptSha: string | null = null;

  constructor(
    @Inject(RATE_LIMIT_REDIS)
    private readonly redis: RedisClientType,
    private readonly jwtService: JwtService,
    private readonly rateLimitConfig: RateLimitConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.scriptSha = await this.redis.scriptLoad(RATE_LIMIT_LUA);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis.isOpen) {
      await this.redis.close();
    }
  }

  async checkRequest(
    request: Request,
    routeKey: string,
    policyName: RateLimitPolicyName = DEFAULT_RATE_LIMIT_POLICY,
  ): Promise<RateLimitDecision> {
    const policy = this.rateLimitConfig.getPolicy(policyName);
    const tracker = await this.resolveTracker(request);
    const keys = this.buildRedisKeys(policy, tracker);
    const security = this.rateLimitConfig.getSecurityConfig();
    const result = await this.executeRateLimitScript(keys, [
      policy.limit.toString(),
      policy.ttlMs.toString(),
      security.blockAfterViolations.toString(),
      security.blockDurationMs.toString(),
      security.violationTtlMs.toString(),
      security.captchaEnabled ? '1' : '0',
      security.captchaAfterViolations.toString(),
      security.captchaTtlMs.toString(),
    ]);

    const decision: RateLimitDecision = {
      allowed: result[0] === 1,
      blocked: result[1] === 1,
      policy,
      tracker,
      routeKey,
      currentHits: result[2],
      remainingHits: result[3],
      retryAfterMs: this.normalizeTtl(result[4]),
      windowResetMs: this.normalizeTtl(result[5]),
      violationCount: result[6],
      captchaRequired: result[7] === 1,
    };

    if (!decision.allowed) {
      this.logViolation(decision);
    }

    return decision;
  }

  buildRouteKey(request: Request): string {
    const req = request as unknown as RequestWithRoute;
    const routePath =
      req.baseUrl && req.route?.path
        ? `${req.baseUrl}${req.route.path}`
        : req.path;
    return `${req.method.toUpperCase()} ${routePath}`;
  }

  private async resolveTracker(request: Request): Promise<RateLimitTracker> {
    const ip = this.resolveIpAddress(request);
    const userId = await this.extractUserId(request);

    if (userId) {
      return {
        key: `user:${userId}`,
        kind: 'user',
        ip,
        userId,
      };
    }

    return {
      key: `ip:${ip}`,
      kind: 'ip',
      ip,
    };
  }

  private resolveIpAddress(request: Request): string {
    const { trustProxy } = this.rateLimitConfig.getSecurityConfig();
    const forwardedFor = request.headers['x-forwarded-for'];

    if (trustProxy) {
      const forwarded =
        typeof forwardedFor === 'string'
          ? forwardedFor
          : Array.isArray(forwardedFor)
            ? forwardedFor[0]
            : undefined;
      if (forwarded) {
        return this.normalizeAddress(forwarded.split(',')[0] ?? forwarded);
      }
    }

    return this.normalizeAddress(
      request.ip ?? request.socket.remoteAddress ?? 'unknown',
    );
  }

  private normalizeAddress(value: string): string {
    return value.trim().replace(/^::ffff:/, '') || 'unknown';
  }

  private async extractUserId(request: Request): Promise<string | undefined> {
    const authorization = request.headers.authorization?.trim();
    if (!authorization?.startsWith('Bearer ')) {
      return undefined;
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      return undefined;
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<JwtRateLimitPayload>(token);
      if (!payload.sub || payload.typ === 'pwd_reset') {
        return undefined;
      }
      return payload.sub;
    } catch {
      return undefined;
    }
  }

  private buildRedisKeys(
    policy: RateLimitPolicy,
    tracker: RateLimitTracker,
  ): [string, string, string, string] {
    const namespace = this.rateLimitConfig.getSecurityConfig().namespace;
    return [
      `${namespace}:window:${policy.key}:${tracker.key}`,
      `${namespace}:violations:${tracker.key}`,
      `${namespace}:blocked:${tracker.key}`,
      `${namespace}:captcha:${tracker.key}`,
    ];
  }

  private async executeRateLimitScript(
    keys: string[],
    args: string[],
  ): Promise<number[]> {
    if (!this.scriptSha) {
      this.scriptSha = await this.redis.scriptLoad(RATE_LIMIT_LUA);
    }

    try {
      const reply = await this.redis.evalSha(this.scriptSha, {
        keys,
        arguments: args,
      });
      return this.parseScriptReply(reply);
    } catch (error) {
      if (this.isNoScriptError(error)) {
        this.scriptSha = await this.redis.scriptLoad(RATE_LIMIT_LUA);
        const reply = await this.redis.evalSha(this.scriptSha, {
          keys,
          arguments: args,
        });
        return this.parseScriptReply(reply);
      }

      throw error;
    }
  }

  private parseScriptReply(reply: unknown): number[] {
    if (!Array.isArray(reply)) {
      throw new Error('Unexpected Redis rate-limit response');
    }

    return reply.map((value) => Number.parseInt(String(value), 10));
  }

  private isNoScriptError(error: unknown): boolean {
    return (
      error instanceof Error && error.message.toUpperCase().includes('NOSCRIPT')
    );
  }

  private normalizeTtl(value: number): number {
    return value > 0 ? value : 0;
  }

  private logViolation(decision: RateLimitDecision): void {
    this.logger.warn(
      JSON.stringify({
        event: 'rate_limit_violation',
        policy: decision.policy.name,
        route: decision.routeKey,
        trackerKind: decision.tracker.kind,
        ip: decision.tracker.ip,
        userId: decision.tracker.userId,
        currentHits: decision.currentHits,
        limit: decision.policy.limit,
        retryAfterMs: decision.retryAfterMs,
        blocked: decision.blocked,
        violationCount: decision.violationCount,
        captchaRequired: decision.captchaRequired,
      }),
    );
  }
}
