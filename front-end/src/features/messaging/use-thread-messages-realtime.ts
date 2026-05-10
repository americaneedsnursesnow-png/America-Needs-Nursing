"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { type Socket } from "socket.io-client";

import { getJobMessagingSocketTarget } from "@/lib/api/env";
import { acquirePooledSocket } from "@/lib/api/pooled-socket.client";
import { listThreadMessages, type ThreadMessage } from "@/lib/api/messaging-api";
import {
  appendThreadMessageIfNew,
  dedupeThreadMessagesById,
} from "@/features/messaging/thread-messages-dedupe";

export type JobMessagingWsState = "connecting" | "live" | "disconnected";

const FALLBACK_POLL_MS = 20_000;

function parseThreadMessage(raw: unknown): ThreadMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const id = typeof m.id === "string" ? m.id : "";
  const conversationId =
    typeof m.conversationId === "string"
      ? m.conversationId
      : typeof m.conversation_id === "string"
        ? m.conversation_id
        : "";
  const senderUserId =
    typeof m.senderUserId === "string"
      ? m.senderUserId
      : typeof m.sender_user_id === "string"
        ? m.sender_user_id
        : "";
  const body = typeof m.body === "string" ? m.body : "";
  const readAtRaw = m.readAt ?? m.read_at;
  const readAt =
    readAtRaw === null
      ? null
      : typeof readAtRaw === "string"
        ? readAtRaw
        : null;
  const createdAtRaw = m.createdAt ?? m.created_at;
  let createdAt = "";
  if (typeof createdAtRaw === "string") createdAt = createdAtRaw;
  else if (
    createdAtRaw &&
    typeof createdAtRaw === "object" &&
    "toISOString" in createdAtRaw
  ) {
    try {
      createdAt = (createdAtRaw as Date).toISOString();
    } catch {
      createdAt = "";
    }
  }
  if (!id || !conversationId || !senderUserId || !createdAt) return null;
  return {
    id,
    conversationId,
    senderUserId,
    body,
    readAt,
    createdAt,
  };
}

function mergeThreadMessages(
  server: ThreadMessage[],
  prev: ThreadMessage[],
): ThreadMessage[] {
  const serverIds = new Set(server.map((x) => x.id));
  const pending = prev.filter((x) => !serverIds.has(x.id));
  return dedupeThreadMessagesById([...server, ...pending]);
}

/**
 * REST bootstrap per thread + Socket.IO `thread:message` + slow REST fallback
 * when the socket is offline.
 */
export function useThreadMessagesRealtime(
  accessToken: string | null | undefined,
  applicationId: string | null | undefined,
  enabled: boolean,
  setMessages: Dispatch<SetStateAction<ThreadMessage[]>>,
  setLoadingMessages: (loading: boolean) => void,
): { wsState: JobMessagingWsState } {
  const [wsState, setWsState] = useState<JobMessagingWsState>("disconnected");
  const setMessagesRef = useRef(setMessages);
  setMessagesRef.current = setMessages;

  const socketRef = useRef<Socket | null>(null);
  const releaseRef = useRef<(() => void) | null>(null);
  const joinedAppIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !accessToken || !applicationId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    let cancelled = false;
    setLoadingMessages(true);
    void listThreadMessages(accessToken, applicationId)
      .then((list) => {
        if (!cancelled) setMessagesRef.current(dedupeThreadMessagesById(list));
      })
      .catch(() => {
        if (!cancelled) setMessagesRef.current([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, accessToken, applicationId, setLoadingMessages, setMessages]);

  useEffect(() => {
    if (!enabled || !accessToken) {
      joinedAppIdRef.current = null;
      if (socketRef.current) {
        try {
          releaseRef.current?.();
        } catch {
          /* ignore */
        }
        releaseRef.current = null;
        socketRef.current = null;
      }
      setWsState("disconnected");
      return;
    }

    const { url, path } = getJobMessagingSocketTarget();
    const { socket, release } = acquirePooledSocket(
      url,
      path,
      accessToken,
    );
    releaseRef.current = release;
    socketRef.current = socket;
    setWsState(socket.connected ? "live" : "connecting");

    const onConnect = () => setWsState("live");
    const onDisconnect = () => setWsState("disconnected");
    const onConnectError = () => setWsState("disconnected");
    const onThreadMessage = (raw: unknown) => {
      const msg = parseThreadMessage(raw);
      if (!msg) return;
      setMessagesRef.current((prev) => appendThreadMessageIfNew(prev, msg));
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("thread:message", onThreadMessage);

    return () => {
      const j = joinedAppIdRef.current;
      if (j) {
        socket.emit("thread:leave", { applicationId: j });
      }
      joinedAppIdRef.current = null;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("thread:message", onThreadMessage);
      try {
        release();
      } catch {
        /* ignore */
      }
      releaseRef.current = null;
      socketRef.current = null;
      setWsState("disconnected");
    };
  }, [enabled, accessToken]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!enabled || !accessToken || !socket) return;

    const syncRooms = () => {
      if (!socket.connected) return;
      const prev = joinedAppIdRef.current;
      const next = applicationId ?? null;
      if (prev && prev !== next) {
        socket.emit("thread:leave", { applicationId: prev });
        joinedAppIdRef.current = null;
      }
      if (next) {
        socket.emit(
          "thread:join",
          { applicationId: next },
          (ack: { ok?: boolean } | undefined) => {
            if (ack?.ok) {
              joinedAppIdRef.current = next;
            }
          },
        );
      }
    };

    if (socket.connected) {
      syncRooms();
    } else {
      socket.once("connect", syncRooms);
    }

    return () => {
      socket.off("connect", syncRooms);
    };
  }, [applicationId, enabled, accessToken]);

  useEffect(() => {
    if (!enabled || !accessToken || !applicationId) return;
    if (wsState === "live") return;

    const tick = () => {
      void listThreadMessages(accessToken, applicationId)
        .then((list) => {
          setMessagesRef.current((prev) => mergeThreadMessages(list, prev));
        })
        .catch(() => {});
    };

    const id = window.setInterval(tick, FALLBACK_POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, accessToken, applicationId, wsState]);

  return { wsState };
}
