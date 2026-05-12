import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Server, ServerOptions } from 'socket.io';
import { createClient, type RedisClientType } from 'redis';

import { getChatServerSocketOptions } from './socket-server-options.util';

/**
 * Shares Socket.IO state across multiple API instances via Redis pub/sub.
 * Enable with `SOCKET_IO_REDIS_ADAPTER=true` and the same `REDIS_*` / `REDIS_URL` as Bull/cache.
 *
 * Connect is **non-fatal**: on failure the adapter stays usable without Redis
 * (`createIOServer` skips `server.adapter(...)`), and callers can fall back to {@link AnnIoAdapter}.
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private pubClient: RedisClientType | null = null;
  private subClient: RedisClientType | null = null;

  constructor(app: NestExpressApplication) {
    super(app);
  }

  /**
   * @returns `true` if Redis pub/sub is wired; `false` if connect failed (app may continue without it).
   */
  async connectToRedis(redisUrl: string): Promise<boolean> {
    let pub: RedisClientType | null = null;
    let sub: RedisClientType | null = null;
    try {
      pub = createClient({ url: redisUrl });
      sub = pub.duplicate();
      await Promise.all([pub.connect(), sub.connect()]);
      this.pubClient = pub;
      this.subClient = sub;
      this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
      this.logger.log('Socket.IO Redis adapter connected');
      return true;
    } catch (err) {
      this.logger.error(
        `Socket.IO Redis adapter: connect failed; continuing without Redis (${err instanceof Error ? err.message : String(err)})`,
        err instanceof Error ? err.stack : undefined,
      );
      await this.safeQuit(sub);
      await this.safeQuit(pub);
      this.pubClient = null;
      this.subClient = null;
      this.adapterConstructor = null;
      return false;
    }
  }

  private async safeQuit(client: RedisClientType | null): Promise<void> {
    if (!client) {
      return;
    }
    try {
      if (client.isOpen) {
        await client.quit();
      }
    } catch {
      /* best-effort */
    }
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...getChatServerSocketOptions(),
      ...options,
    }) as Server;
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
