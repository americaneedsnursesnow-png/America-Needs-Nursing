import { Logger as NestLogger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AnnIoAdapter } from './common/adapters/ann-io.adapter';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { privateNetworkAccessMiddleware } from './common/middleware/private-network-access.middleware';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import {
  buildRedisConnectionUrl,
  getConfigBoolean,
  getCorsOrigins,
} from './common/utils/env.util';
import { getUploadsRoot } from './nurse-profiles/nurse-resume.storage';
import { FileStorageService } from './storage/file-storage.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  app.set(
    'trust proxy',
    getConfigBoolean(config, 'TRUST_PROXY', false) ? 1 : false,
  );

  app.use(requestIdMiddleware);

  app.use(
    helmet({
      hidePoweredBy: true,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  if (getConfigBoolean(config, 'HELMET_CSP_ON_FILES', false)) {
    app.use(
      '/files',
      helmet.contentSecurityPolicy({
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          mediaSrc: ["'self'", 'https:', 'blob:'],
          fontSrc: ["'self'", 'https:', 'data:'],
        },
      }),
    );
  }

  if (getConfigBoolean(config, 'ENABLE_RESPONSE_COMPRESSION', true)) {
    app.use(
      compression({
        filter: (req, res) => {
          if (req.url?.startsWith('/health') || req.url?.startsWith('/metrics')) {
            return false;
          }
          return compression.filter(req, res);
        },
        threshold: 1024,
      }),
    );
  }

  const fileStorage = app.get(FileStorageService);
  if (fileStorage.isLocalDriver()) {
    const uploadsRoot = getUploadsRoot();
    app.useStaticAssets(uploadsRoot, {
      prefix: '/files/',
      index: false,
      fallthrough: true,
    });
  }
  // Bind Socket.IO to the same HTTP server Express uses; optional Redis adapter for multi-instance.
  const useRedisSocketAdapter = getConfigBoolean(
    config,
    'SOCKET_IO_REDIS_ADAPTER',
    false,
  );
  const bootstrapLog = new NestLogger('Bootstrap');
  if (useRedisSocketAdapter) {
    const redisIoAdapter = new RedisIoAdapter(app);
    const redisOk = await redisIoAdapter.connectToRedis(
      buildRedisConnectionUrl(config),
    );
    if (redisOk) {
      app.useWebSocketAdapter(redisIoAdapter);
    } else {
      bootstrapLog.warn(
        'SOCKET_IO_REDIS_ADAPTER=true but Redis did not connect; using in-process Socket.IO adapter (single-instance only)',
      );
      app.useWebSocketAdapter(new AnnIoAdapter(app));
    }
  } else {
    app.useWebSocketAdapter(new AnnIoAdapter(app));
  }

  const corsOrigin = getCorsOrigins(config);
  app.use(privateNetworkAccessMiddleware);
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Accept',
      'X-Requested-With',
      'Access-Control-Request-Private-Network',
    ],
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
