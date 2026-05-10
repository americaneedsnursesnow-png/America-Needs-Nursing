import type { ServerOptions } from 'socket.io';

/**
 * Reasonable defaults for long‑lived mobile connections (pings, buffer cap).
 * See https://socket.io/docs/v4/server-api/#new-Server
 */
export function getChatServerSocketOptions(): Partial<ServerOptions> {
  return {
    connectTimeout: 20_000,
    pingTimeout: 20_000,
    pingInterval: 25_000,
    maxHttpBufferSize: 1e6,
  };
}
