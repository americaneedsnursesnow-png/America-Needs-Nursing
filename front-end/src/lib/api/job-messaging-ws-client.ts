"use client";

import { BackendRequestError } from "@/lib/api/authed-client";
import { getJobMessagingSocketTarget } from "@/lib/api/env";
import {
  acquirePooledSocket,
  waitForSocketConnect,
} from "@/lib/api/pooled-socket.client";

const WS_OP_TIMEOUT_MS = 20_000;

/**
 * Pooled Socket.IO emit to Nest `/job-messaging` (reuses a long‑lived connection
 * with {@link useThreadMessagesRealtime} for fewer handshakes and faster sends).
 */
export async function jobMessagingEmit<
  TBody extends object,
  TAck extends { ok?: boolean; error?: string },
>(accessToken: string, event: string, body: TBody): Promise<TAck> {
  if (typeof window === "undefined") {
    throw new BackendRequestError(
      501,
      "Job messaging is only available in the browser (WebSocket).",
      null,
    );
  }

  const { url, path } = getJobMessagingSocketTarget();
  const { socket, release } = acquirePooledSocket(
    url,
    path,
    accessToken,
  );

  try {
    await waitForSocketConnect(socket, WS_OP_TIMEOUT_MS);
  } catch (e) {
    try {
      release();
    } catch {
      /* ignore */
    }
    const msg =
      e instanceof Error
        ? e.message
        : "Cannot connect to job messaging. Check NEXT_PUBLIC_NEST_SOCKET_ORIGIN and that ann-backend is running.";
    throw new BackendRequestError(502, msg, null);
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const doRelease = () => {
      if (settled) return;
      settled = true;
      try {
        release();
      } catch {
        /* ignore */
      }
    };

    const timer = window.setTimeout(() => {
      doRelease();
      reject(
        new BackendRequestError(
          504,
          "Job messaging request timed out (socket).",
          null,
        ),
      );
    }, WS_OP_TIMEOUT_MS);

    socket.emit(event, body, (ack: TAck | undefined) => {
      window.clearTimeout(timer);
      doRelease();
      if (ack === undefined || typeof ack !== "object") {
        reject(
          new BackendRequestError(
            502,
            "Invalid or missing acknowledgment from job messaging server.",
            ack ?? null,
          ),
        );
        return;
      }
      resolve(ack);
    });
  });
}

export function assertJobMessagingOk<T extends { ok: true }>(
  ack: { ok?: boolean; error?: string },
  context: string,
): asserts ack is T {
  if (ack.ok === true) return;
  const msg =
    typeof ack.error === "string" && ack.error.trim()
      ? ack.error
      : `${context} failed`;
  throw new BackendRequestError(400, msg, ack);
}
