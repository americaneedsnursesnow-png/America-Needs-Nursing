import type { ThreadMessage } from "@/lib/api/messaging-api";

export function sortThreadMessagesByTime(messages: ThreadMessage[]): ThreadMessage[] {
  return [...messages].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/** One row per message id (avoids duplicate React keys when WS + REST both deliver). */
export function dedupeThreadMessagesById(
  messages: ThreadMessage[],
): ThreadMessage[] {
  const map = new Map<string, ThreadMessage>();
  for (const m of messages) {
    map.set(m.id, m);
  }
  return sortThreadMessagesByTime([...map.values()]);
}

export function appendThreadMessageIfNew(
  prev: ThreadMessage[],
  msg: ThreadMessage,
): ThreadMessage[] {
  if (prev.some((m) => m.id === msg.id)) return prev;
  return dedupeThreadMessagesById([...prev, msg]);
}
