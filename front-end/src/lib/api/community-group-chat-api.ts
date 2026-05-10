import { authedJson } from "./authed-client";

/** Matches Nest `CommunityChatMessageView` (group chat / WebSocket). */
export type CommunityChatMessage = {
  id: string;
  clientName: string;
  /** Present for nurse sub-community messages */
  nurseCommunityId?: string | null;
  senderUserId: string;
  senderEmail: string;
  senderRole: string;
  body: string;
  createdAt: string;
};

export type GlobalChatMentionRow = {
  userId: string;
  email: string;
  fullName: string | null;
};

export async function fetchGlobalCommunityChatHistory(
  accessToken: string,
  limit = 100,
): Promise<CommunityChatMessage[]> {
  const q = new URLSearchParams({ limit: String(limit) });
  const raw = await authedJson<unknown>(
    `/community/chat/history?${q}`,
    accessToken,
    { method: "GET" },
  );
  return Array.isArray(raw) ? (raw as CommunityChatMessage[]) : [];
}

export async function fetchGlobalMentionRows(
  accessToken: string,
): Promise<GlobalChatMentionRow[]> {
  const raw = await authedJson<unknown>(
    "/community/chat/mention-suggestions",
    accessToken,
    { method: "GET" },
  );
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => r as GlobalChatMentionRow);
}

/** For unread badges: latest time (ms) a peer message arrived after `afterMs` in main (global) chat. */
export async function latestGlobalChatPeerTimeMs(
  accessToken: string,
  myUserId: string,
  afterMs: number,
): Promise<number> {
  try {
    const hist = await fetchGlobalCommunityChatHistory(accessToken, 150);
    let max = 0;
    for (const m of hist) {
      if (m.senderUserId === myUserId) continue;
      const t = new Date(m.createdAt).getTime();
      if (t > afterMs && t > max) {
        max = t;
      }
    }
    return max;
  } catch {
    return 0;
  }
}
