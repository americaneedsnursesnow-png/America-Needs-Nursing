import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_POLICY_KEY } from '../rate-limit.constants';
import type { RateLimitPolicyName } from '../rate-limit.types';

export function RateLimitPolicy(policy: RateLimitPolicyName): MethodDecorator {
  return SetMetadata(RATE_LIMIT_POLICY_KEY, policy);
}
