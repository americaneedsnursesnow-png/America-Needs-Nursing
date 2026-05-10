export type RateLimitPolicyName = 'global' | 'login' | 'otp' | 'password-reset';

export interface RateLimitPolicy {
  name: RateLimitPolicyName;
  key: string;
  limit: number;
  ttlMs: number;
}

export interface RateLimitSecurityConfig {
  namespace: string;
  trustProxy: boolean;
  violationTtlMs: number;
  blockAfterViolations: number;
  blockDurationMs: number;
  captchaEnabled: boolean;
  captchaAfterViolations: number;
  captchaTtlMs: number;
}

export interface RateLimitTracker {
  key: string;
  kind: 'ip' | 'user';
  ip: string;
  userId?: string;
}

export interface RateLimitDecision {
  allowed: boolean;
  blocked: boolean;
  policy: RateLimitPolicy;
  tracker: RateLimitTracker;
  routeKey: string;
  currentHits: number;
  remainingHits: number;
  retryAfterMs: number;
  windowResetMs: number;
  violationCount: number;
  captchaRequired: boolean;
}
