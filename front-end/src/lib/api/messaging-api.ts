"use client";

import { assertJobMessagingOk, jobMessagingEmit } from "./job-messaging-ws-client";

export type MessagingThread = {
  applicationId: string;
  lastMessageAt: string | null;
};

export type ThreadMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

type ThreadsListAck =
  | { ok: true; threads: MessagingThread[] }
  | { ok: false; error: string };

type ThreadMessagesAck =
  | { ok: true; messages: ThreadMessage[] }
  | { ok: false; error: string };

type ThreadSendAck =
  | { ok: true; message: ThreadMessage }
  | { ok: false; error: string };

/** Uses Socket.IO `threads:list` on `/job-messaging` (no REST). */
export async function listMessagingThreads(
  accessToken: string,
): Promise<MessagingThread[]> {
  const ack = await jobMessagingEmit<Record<string, never>, ThreadsListAck>(
    accessToken,
    "threads:list",
    {},
  );
  assertJobMessagingOk<{ ok: true; threads: MessagingThread[] }>(
    ack,
    "threads:list",
  );
  return ack.threads;
}

/** Uses Socket.IO `thread:messages` on `/job-messaging` (no REST). */
export async function listThreadMessages(
  accessToken: string,
  applicationId: string,
): Promise<ThreadMessage[]> {
  const ack = await jobMessagingEmit<
    { applicationId: string },
    ThreadMessagesAck
  >(accessToken, "thread:messages", { applicationId });
  assertJobMessagingOk<{ ok: true; messages: ThreadMessage[] }>(
    ack,
    "thread:messages",
  );
  return ack.messages;
}

/** Uses Socket.IO `thread:send` on `/job-messaging` (no REST). */
export async function sendThreadMessage(
  accessToken: string,
  applicationId: string,
  body: string,
): Promise<ThreadMessage> {
  const ack = await jobMessagingEmit<
    { applicationId: string; body: string },
    ThreadSendAck
  >(accessToken, "thread:send", { applicationId, body });
  assertJobMessagingOk<{ ok: true; message: ThreadMessage }>(
    ack,
    "thread:send",
  );
  return ack.message;
}
