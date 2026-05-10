import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Stable request correlation id for logs, tracing, and client support tickets.
 * Honors incoming `X-Request-Id` when present and valid; otherwise generates one.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.get(REQUEST_ID_HEADER)?.trim();
  const id =
    incoming && incoming.length <= 128 && /^[\w.-]{1,128}$/.test(incoming)
      ? incoming
      : randomUUID();
  (req as Request & { requestId: string }).requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}
