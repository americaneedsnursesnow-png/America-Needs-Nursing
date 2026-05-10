import {
  CallHandler,
  ExecutionContext,
  GatewayTimeoutException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { getConfigNumber } from '../utils/env.util';

/**
 * Caps HTTP handler work so slow queries / stuck promises cannot hold workers forever.
 * Skips WebSocket contexts. Tune with `REQUEST_TIMEOUT_MS` (default 55s).
 */
@Injectable()
export class RequestTimeoutInterceptor implements NestInterceptor {
  constructor(private readonly config: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest<Request>();
    if (typeof req.path === 'string' && req.path.startsWith('/socket.io')) {
      return next.handle();
    }

    const ms = getConfigNumber(
      this.config,
      'REQUEST_TIMEOUT_MS',
      55_000,
      1000,
    );

    return next.handle().pipe(
      timeout(ms),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new GatewayTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  }
}
