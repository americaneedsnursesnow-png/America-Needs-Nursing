import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttp ? exception.getResponse() : 'Internal server error';

    if (!isHttp) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const rid = (req as Request & { requestId?: string }).requestId;
    const base =
      typeof message === 'string'
        ? { statusCode: status, message, path: req.url }
        : { ...message, path: req.url };
    const body = rid !== undefined ? { ...base, requestId: rid } : base;

    res.status(status).json(body);
  }
}
