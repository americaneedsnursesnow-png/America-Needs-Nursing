import type { NextFunction, Request, Response } from 'express';

/**
 * Chrome / modern browsers: public HTTPS origins calling `http://localhost` require
 * `Access-Control-Allow-Private-Network: true` on the CORS preflight. Register before
 * `app.enableCors` so `/socket.io` polling receives the header too.
 */
export function privateNetworkAccessMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.get('Access-Control-Request-Private-Network') === 'true') {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
}
