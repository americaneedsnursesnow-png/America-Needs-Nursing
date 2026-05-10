import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

import { SkipRateLimit } from '../rate-limit/decorators/skip-rate-limit.decorator';
import { HealthService } from './health.service';

/**
 * Liveness / readiness for orchestrators. Rate limits skipped so probes do not consume quota.
 */
@Controller('health')
@SkipRateLimit()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** Process is up (does not verify DB or Redis). */
  @Get()
  live(): { status: 'live' } {
    return { status: 'live' };
  }

  /** Database + Redis reachable. HTTP 503 if any dependency fails. */
  @Get('ready')
  async ready(): Promise<{
    status: 'ready';
    checks: { database: boolean; redis: boolean };
  }> {
    const { ok, checks } = await this.healthService.getReadiness();
    if (!ok) {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        checks,
      });
    }
    return { status: 'ready', checks };
  }

  /** Legacy probe — database only. */
  @Get('db')
  async db(): Promise<{ ok: true }> {
    const database = await this.healthService.checkDatabase();
    if (!database) {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        checks: { database: false, redis: false },
      });
    }
    return { ok: true };
  }
}
