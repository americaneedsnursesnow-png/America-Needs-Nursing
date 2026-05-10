import type { ManagerOptions } from "socket.io-client";

/**
 * Tuned for long‑lived chat: prefer WebSocket, then polling; patient reconnects on mobile.
 */
export const CHAT_SOCKET_IO_CLIENT_OPTIONS: Partial<ManagerOptions> = {
  transports: ["websocket", "polling"],
  upgrade: true,
  rememberUpgrade: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1_000,
  reconnectionDelayMax: 15_000,
  randomizationFactor: 0.5,
  timeout: 20_000,
};
