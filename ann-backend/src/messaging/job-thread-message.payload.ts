import type { Message } from '../database/entities';

/** JSON shape for REST + Socket.IO `thread:message` (job application threads). */
export interface JobThreadMessagePayload {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export function jobThreadMessageFromEntity(
  msg: Message,
): JobThreadMessagePayload {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderUserId: msg.senderUserId,
    body: msg.body,
    readAt: msg.readAt ? msg.readAt.toISOString() : null,
    createdAt: msg.createdAt.toISOString(),
  };
}

/** One row from `threads:list` (job messaging WebSocket). */
export interface JobMessagingThreadListItem {
  applicationId: string;
  lastMessageAt: string | null;
}
