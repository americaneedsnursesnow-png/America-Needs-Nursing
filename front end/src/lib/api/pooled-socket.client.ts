"use client";

import { io, type Socket } from "socket.io-client";

import { CHAT_SOCKET_IO_CLIENT_OPTIONS } from "./socket-io-client-options";

const IDLE_DISCONNECT_MS = 45_000;

type Pooled = {
  socket: Socket;
  ref: number;
  idle: ReturnType<typeof setTimeout> | null;
};

const pool = new Map<string, Pooled>();

function makeKey(url: string, path: string, accessToken: string) {
  return `${url}\0${path}\0${accessToken}`;
}

function scheduleIdle(key: string, p: Pooled) {
  if (p.ref > 0) return;
  if (p.idle) clearTimeout(p.idle);
  p.idle = setTimeout(() => {
    if (p.ref > 0) return;
    try {
      p.socket.removeAllListeners();
    } catch {
      /* best-effort */
    }
    p.socket.disconnect();
    pool.delete(key);
  }, IDLE_DISCONNECT_MS);
}

/**
 * Reuses a single Engine.IO connection per (namespace URL + token) like native apps do,
 * with ref-counting and an idle close when nothing holds the socket.
 */
export function acquirePooledSocket(
  url: string,
  path: string,
  accessToken: string,
): { socket: Socket; release: () => void } {
  const key = makeKey(url, path, accessToken);
  let p = pool.get(key);
  if (!p) {
    const socket = io(url, {
      path,
      auth: { token: accessToken },
      ...CHAT_SOCKET_IO_CLIENT_OPTIONS,
    });
    p = { socket, ref: 0, idle: null };
    pool.set(key, p);
  } else if (p.idle) {
    clearTimeout(p.idle);
    p.idle = null;
  }
  p.ref += 1;
  return {
    socket: p.socket,
    release: () => {
      const ent = pool.get(key);
      if (!ent) return;
      ent.ref = Math.max(0, ent.ref - 1);
      scheduleIdle(key, ent);
    },
  };
}

export function waitForSocketConnect(
  socket: Socket,
  timeoutMs: number,
): Promise<void> {
  if (socket.connected) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
      reject(
        new Error(
          `Socket did not connect within ${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);
    const onConnect = () => {
      window.clearTimeout(t);
      resolve();
    };
    const onError = (e: Error) => {
      window.clearTimeout(t);
      reject(e);
    };
    socket.once("connect", onConnect);
    socket.once("connect_error", onError);
  });
}
