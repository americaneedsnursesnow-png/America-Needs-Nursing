import { Controller, Get, Header, NotFoundException } from '@nestjs/common';

import { SkipRateLimit } from '../rate-limit/decorators/skip-rate-limit.decorator';
import { MetricsService } from './metrics.service';

@Controller('metrics')
@SkipRateLimit()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async scrape(): Promise<string> {
    if (!this.metrics.isEnabled()) {
      throw new NotFoundException();
    }
    return this.metrics.register.metrics();
  }
}
