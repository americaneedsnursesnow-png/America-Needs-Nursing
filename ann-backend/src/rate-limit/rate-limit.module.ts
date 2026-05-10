import { createClient, type RedisClientType } from '@keyv/redis';
import { JwtModule } from '@nestjs/jwt';
import { Module, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { buildRedisConnectionUrl } from '../common/utils/env.util';
import { RATE_LIMIT_REDIS } from './rate-limit.constants';
import { RateLimitConfigService } from './rate-limit-config.service';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET')?.trim();
        if (!secret) {
          throw new Error('JWT_SECRET is required');
        }
        return { secret };
      },
    }),
  ],
  providers: [
    RateLimitConfigService,
    {
      provide: RATE_LIMIT_REDIS,
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<RedisClientType> => {
        const logger = new Logger('RateLimitRedis');
        const client = createClient({
          url: buildRedisConnectionUrl(config),
          socket: {
            reconnectStrategy: (retries) => Math.min(retries * 50, 500),
          },
        });

        client.on('error', (error) => {
          logger.error(
            error instanceof Error ? error.message : String(error),
            error instanceof Error ? error.stack : undefined,
          );
        });

        if (!client.isOpen) {
          await client.connect();
        }

        return client;
      },
    },
    RateLimitService,
    RateLimitGuard,
    {
      provide: APP_GUARD,
      useExisting: RateLimitGuard,
    },
  ],
  exports: [RateLimitConfigService, RateLimitService],
})
export class RateLimitModule {}
