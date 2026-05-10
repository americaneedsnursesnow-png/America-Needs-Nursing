import { IoAdapter } from '@nestjs/platform-socket.io';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Server, ServerOptions } from 'socket.io';

import { getChatServerSocketOptions } from './socket-server-options.util';

/**
 * Default Socket.IO server options (ping intervals, etc.) for chat gateways.
 */
export class AnnIoAdapter extends IoAdapter {
  constructor(app: NestExpressApplication) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    return super.createIOServer(
      port,
      { ...getChatServerSocketOptions(), ...options },
    ) as Server;
  }
}
