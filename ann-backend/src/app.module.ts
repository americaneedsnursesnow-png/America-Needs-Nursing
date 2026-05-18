import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { IncomingMessage } from 'node:http';
import { LoggerModule } from 'nestjs-pino';
import { ApplicationsModule } from './applications/applications.module';
import { EngagementModule } from './engagement/engagement.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';
import { BlogModule } from './blog/blog.module';
import { CommunityModule } from './community/community.module';
import { CompaniesModule } from './companies/companies.module';
import { PlatformModule } from './common/platform/platform.module';
import { buildRedisConnectionUrl } from './common/utils/env.util';
import { typeOrmEntities } from './database/entities';
import { JobPackagesModule } from './job-packages/job-packages.module';
import { JobsModule } from './jobs/jobs.module';
import { MetricsModule } from './metrics/metrics.module';
import { MessagingModule } from './messaging/messaging.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NurseDatabaseModule } from './nurse-database/nurse-database.module';
import { NurseProfilesModule } from './nurse-profiles/nurse-profiles.module';
import { PaymentsModule } from './payments/payments.module';
import { PublicModule } from './public/public.module';
import { QueuesModule } from './queues/queues.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { NurseImportModule } from './nurse-import/nurse-import.module';
import { StorageModule } from './storage/storage.module';

function envTrim(
  config: ConfigService,
  key: string,
  defaultValue: string,
): string {
  const raw = config.get<string | undefined>(key);
  const value = raw?.trim();
  return value === undefined || value === '' ? defaultValue : value;
}

function typeOrmSlowQueryMs(config: ConfigService): number | undefined {
  const raw = envTrim(config, 'DATABASE_SLOW_QUERY_MS', '2500');
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Passed to `pg` pool via TypeORM `extra` (see node-postgres Pool options). */
function typeOrmPgPoolExtra(config: ConfigService): Record<string, unknown> {
  return {
    max: parseInt(envTrim(config, 'DATABASE_POOL_MAX', '36'), 10),
    min: parseInt(envTrim(config, 'DATABASE_POOL_MIN', '2'), 10),
    idleTimeoutMillis: parseInt(
      envTrim(config, 'DATABASE_POOL_IDLE_MS', '30000'),
      10,
    ),
    connectionTimeoutMillis: parseInt(
      envTrim(config, 'DATABASE_POOL_CONN_TIMEOUT_MS', '10000'),
      10,
    ),
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    StorageModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd =
          envTrim(config, 'NODE_ENV', 'development') === 'production';
        return {
          pinoHttp: {
            level: envTrim(config, 'LOG_LEVEL', 'info'),
            transport: isProd
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: { singleLine: true, colorize: true },
                },
            autoLogging: {
              ignore: (req: { url?: string }) =>
                Boolean(
                  req.url?.startsWith('/health') ||
                  req.url?.startsWith('/metrics'),
                ),
            },
            customProps: (req: IncomingMessage) => {
              const rid = (req as IncomingMessage & { requestId?: string })
                .requestId;
              return rid !== undefined ? { requestId: rid } : {};
            },
          },
        };
      },
    }),
    PlatformModule,
    QueuesModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = buildRedisConnectionUrl(config);
        return {
          stores: [createKeyv(url, { namespace: 'ann' })],
          ttl: 5 * 60 * 1000,
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const synchronize =
          envTrim(config, 'TYPEORM_SYNCHRONIZE', 'false') === 'true';
        const url = config.get<string | undefined>('DATABASE_URL')?.trim();
        const poolExtra = typeOrmPgPoolExtra(config);
        const maxQueryExecutionTime = typeOrmSlowQueryMs(config);
        if (url) {
          return {
            type: 'postgres' as const,
            url,
            entities: typeOrmEntities,
            synchronize,
            extra: poolExtra,
            maxQueryExecutionTime,
          };
        }
        return {
          type: 'postgres' as const,
          host: envTrim(config, 'DATABASE_HOST', 'localhost'),
          port: parseInt(envTrim(config, 'DATABASE_PORT', '5432'), 10),
          username: envTrim(config, 'DATABASE_USER', 'postgres'),
          password: envTrim(config, 'DATABASE_PASSWORD', ''),
          database: envTrim(config, 'DATABASE_NAME', 'postgres'),
          entities: typeOrmEntities,
          synchronize,
          extra: poolExtra,
          maxQueryExecutionTime,
        };
      },
    }),
    AuthModule,
    AccountModule,
    UsersModule,
    ClientsModule,
    NurseImportModule,
    NurseProfilesModule,
    CompaniesModule,
    JobPackagesModule,
    JobsModule,
    PaymentsModule,
    ApplicationsModule,
    MessagingModule,
    BlogModule,
    NewsletterModule,
    CommunityModule,
    NotificationsModule,
    NurseDatabaseModule,
    PublicModule,
    EngagementModule,
    RateLimitModule,
    HealthModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
