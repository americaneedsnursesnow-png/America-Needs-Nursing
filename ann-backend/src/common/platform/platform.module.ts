import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { RequestTimeoutInterceptor } from '../interceptors/request-timeout.interceptor';

/**
 * Cross-cutting HTTP concerns (timeouts, future global interceptors).
 * Security-oriented Express middleware stays in `main.ts` for ordering control.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestTimeoutInterceptor,
    },
  ],
})
export class PlatformModule {}
