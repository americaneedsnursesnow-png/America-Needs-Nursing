import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { collectDefaultMetrics, Registry } from 'prom-client';

import { getConfigBoolean } from '../common/utils/env.util';

/** Prometheus scrape registry; default metrics registered once when enabled. */
@Injectable()
export class MetricsService implements OnModuleInit {
  readonly register = new Registry();

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return getConfigBoolean(this.config, 'METRICS_ENABLED', false);
  }

  onModuleInit(): void {
    if (!this.isEnabled()) {
      return;
    }
    collectDefaultMetrics({ register: this.register, prefix: 'ann_' });
  }
}
