import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { createClient, type RedisClientType } from 'redis';
import { DataSource } from 'typeorm';

import { buildRedisConnectionUrl } from '../common/utils/env.util';

export type ReadinessChecks = {
  database: boolean;
  redis: boolean;
};

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async checkRedis(): Promise<boolean> {
    const url = buildRedisConnectionUrl(this.config);
    let client: RedisClientType | undefined;
    try {
      client = createClient({ url });
      await client.connect();
      const pong = await client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    } finally {
      if (client?.isOpen) {
        try {
          await client.quit();
        } catch {
          try {
            await client.disconnect();
          } catch {
            /* ignore */
          }
        }
      }
    }
  }

  async getReadiness(): Promise<{ ok: boolean; checks: ReadinessChecks }> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);
    return {
      ok: database && redis,
      checks: { database, redis },
    };
  }
}
