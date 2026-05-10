import { SetMetadata } from '@nestjs/common';
import { SKIP_RATE_LIMIT_KEY } from '../rate-limit.constants';

export function SkipRateLimit(): MethodDecorator & ClassDecorator {
  return SetMetadata(SKIP_RATE_LIMIT_KEY, true);
}
