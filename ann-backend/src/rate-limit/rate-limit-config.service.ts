import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getConfigBoolean,
  getConfigNumber,
  getConfigString,
} from '../common/utils/env.util';
import {
  type RateLimitPolicy,
  type RateLimitPolicyName,
  type RateLimitSecurityConfig,
} from './rate-limit.types';

function secondsToMilliseconds(seconds: number): number {
  return seconds * 1000;
}

@Injectable()
export class RateLimitConfigService {
  private readonly securityConfig: RateLimitSecurityConfig;
  private readonly policies = new Map<RateLimitPolicyName, RateLimitPolicy>();

  constructor(private readonly config: ConfigService) {
    this.securityConfig = {
      namespace: getConfigString(
        config,
        'RATE_LIMIT_REDIS_NAMESPACE',
        'ann:ratelimit',
      ),
      trustProxy: getConfigBoolean(config, 'RATE_LIMIT_TRUST_PROXY', false),
      violationTtlMs: secondsToMilliseconds(
        getConfigNumber(config, 'RATE_LIMIT_VIOLATION_WINDOW_SECONDS', 3600, 1),
      ),
      blockAfterViolations: getConfigNumber(
        config,
        'RATE_LIMIT_BLOCK_AFTER_VIOLATIONS',
        3,
        1,
      ),
      blockDurationMs: secondsToMilliseconds(
        getConfigNumber(config, 'RATE_LIMIT_BLOCK_DURATION_SECONDS', 900, 1),
      ),
      captchaEnabled: getConfigBoolean(
        config,
        'RATE_LIMIT_CAPTCHA_ENABLED',
        true,
      ),
      captchaAfterViolations: getConfigNumber(
        config,
        'RATE_LIMIT_CAPTCHA_AFTER_VIOLATIONS',
        2,
        1,
      ),
      captchaTtlMs: secondsToMilliseconds(
        getConfigNumber(config, 'RATE_LIMIT_CAPTCHA_TTL_SECONDS', 1800, 1),
      ),
    };

    this.registerPolicy(
      'global',
      'global',
      getConfigNumber(config, 'RATE_LIMIT_GLOBAL_LIMIT', 100, 1),
      getConfigNumber(config, 'RATE_LIMIT_GLOBAL_WINDOW_SECONDS', 60, 1),
    );
    this.registerPolicy(
      'login',
      'login',
      getConfigNumber(config, 'RATE_LIMIT_LOGIN_LIMIT', 5, 1),
      getConfigNumber(config, 'RATE_LIMIT_LOGIN_WINDOW_SECONDS', 60, 1),
    );
    this.registerPolicy(
      'otp',
      'otp',
      getConfigNumber(config, 'RATE_LIMIT_OTP_LIMIT', 3, 1),
      getConfigNumber(config, 'RATE_LIMIT_OTP_WINDOW_SECONDS', 300, 1),
    );
    this.registerPolicy(
      'password-reset',
      'password-reset',
      getConfigNumber(config, 'RATE_LIMIT_PASSWORD_RESET_LIMIT', 3, 1),
      getConfigNumber(
        config,
        'RATE_LIMIT_PASSWORD_RESET_WINDOW_SECONDS',
        600,
        1,
      ),
    );
  }

  getSecurityConfig(): RateLimitSecurityConfig {
    return this.securityConfig;
  }

  getPolicy(name: RateLimitPolicyName): RateLimitPolicy {
    const policy = this.policies.get(name);
    if (!policy) {
      throw new Error(`Unknown rate limit policy: ${name}`);
    }
    return policy;
  }

  private registerPolicy(
    name: RateLimitPolicyName,
    key: string,
    limit: number,
    ttlSeconds: number,
  ): void {
    this.policies.set(name, {
      name,
      key,
      limit,
      ttlMs: secondsToMilliseconds(ttlSeconds),
    });
  }
}
