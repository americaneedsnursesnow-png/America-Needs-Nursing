import type { RateLimitPolicyName } from './rate-limit.types';

export const RATE_LIMIT_POLICY_KEY = 'rate-limit:policy';
export const SKIP_RATE_LIMIT_KEY = 'rate-limit:skip';
export const RATE_LIMIT_REDIS = Symbol('RATE_LIMIT_REDIS');

export const DEFAULT_RATE_LIMIT_POLICY: RateLimitPolicyName = 'global';
