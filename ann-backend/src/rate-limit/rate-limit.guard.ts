import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import {
  DEFAULT_RATE_LIMIT_POLICY,
  RATE_LIMIT_POLICY_KEY,
  SKIP_RATE_LIMIT_KEY,
} from './rate-limit.constants';
import { RateLimitService } from './rate-limit.service';
import type {
  RateLimitDecision,
  RateLimitPolicyName,
} from './rate-limit.types';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    /** Socket.IO (namespaces like /job-messaging, /community-chat) uses HTTP long-polling; must not hit global limits. */
    if (
      typeof request.path === 'string' &&
      request.path.startsWith('/socket.io')
    ) {
      return true;
    }

    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) {
      return true;
    }
    const response = context.switchToHttp().getResponse<Response>();
    const policyName =
      this.reflector.getAllAndOverride<RateLimitPolicyName>(
        RATE_LIMIT_POLICY_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? DEFAULT_RATE_LIMIT_POLICY;

    const decision = await this.rateLimitService.checkRequest(
      request,
      this.rateLimitService.buildRouteKey(request),
      policyName,
    );

    this.applyHeaders(response, decision);
    if (decision.captchaRequired) {
      response.setHeader('X-Captcha-Required', 'true');
    }

    if (decision.allowed) {
      return true;
    }

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(decision.retryAfterMs / 1000),
    );
    response.setHeader('Retry-After', retryAfterSeconds.toString());

    throw new HttpException(
      {
        statusCode: 429,
        error: 'Too Many Requests',
        message: decision.blocked
          ? 'Too many requests. Temporary block in effect.'
          : 'Too many requests. Please try again later.',
        policy: decision.policy.name,
        limit: decision.policy.limit,
        retryAfter: retryAfterSeconds,
        captchaRequired: decision.captchaRequired,
        tracker: decision.tracker.kind,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private applyHeaders(response: Response, decision: RateLimitDecision): void {
    response.setHeader('X-RateLimit-Limit', decision.policy.limit.toString());
    response.setHeader(
      'X-RateLimit-Remaining',
      decision.remainingHits.toString(),
    );
    response.setHeader(
      'X-RateLimit-Reset',
      Math.ceil(decision.windowResetMs / 1000).toString(),
    );
    response.setHeader('X-RateLimit-Policy', decision.policy.name);
  }
}
