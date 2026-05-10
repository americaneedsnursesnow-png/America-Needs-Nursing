import { authedJson, authedMultipartJson, authedVoid } from "./authed-client";
import type { CommunityChatMessage } from "./community-group-chat-api";

export type NurseCommunityListItem = {
  id: string;
  clientName: string;
  creatorUserId: string;
  name: string;
  description: string;
  rules: string;
  imageUrl: string | null;
  createdAt: string;
  memberCount: number;
  isMember: boolean;
  isOwner: boolean;
};

export type NurseCommunityDetail = NurseCommunityListItem & {
  updatedAt: string;
  creatorEmail: string;
};

export type NurseCommunityMemberRow = {
  userId: string;
  email: string;
  fullName: string | null;
  joinedAt: string;
};

export async function listNurseCommunities(accessToken: string): Promise<{
  items: NurseCommunityListItem[];
  myCommunity: NurseCommunityListItem | null;
}> {
  return authedJson("/community/nurse-communities", accessToken, {
    method: "GET",
  });
}

export async function getNurseCommunity(
  accessToken: string,
  id: string,
): Promise<NurseCommunityDetail> {
  return authedJson(`/community/nurse-communities/${id}`, accessToken, {
    method: "GET",
  });
}

export async function listNurseCommunityMembers(
  accessToken: string,
  id: string,
): Promise<NurseCommunityMemberRow[]> {
  return authedJson(`/community/nurse-communities/${id}/members`, accessToken, {
    method: "GET",
  });
}

export async function createNurseCommunity(
  accessToken: string,
  body: { name: string; description: string; rules: string },
): Promise<NurseCommunityListItem> {
  return authedJson("/community/nurse-communities", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateNurseCommunity(
  accessToken: string,
  id: string,
  body: Partial<{
    name: string;
    description: string;
    rules: string;
    imageUrl: string | null;
  }>,
): Promise<NurseCommunityListItem> {
  return authedJson(`/community/nurse-communities/${id}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function joinNurseCommunity(
  accessToken: string,
  id: string,
): Promise<{ ok: true }> {
  return authedJson(`/community/nurse-communities/${id}/join`, accessToken, {
    method: "POST",
    body: "{}",
  });
}

export async function leaveNurseCommunity(
  accessToken: string,
  id: string,
): Promise<void> {
  return authedVoid(`/community/nurse-communities/${id}/leave`, accessToken, {
    method: "POST",
  });
}

export async function removeNurseCommunityMember(
  accessToken: string,
  communityId: string,
  userId: string,
): Promise<void> {
  return authedVoid(
    `/community/nurse-communities/${communityId}/members/${userId}`,
    accessToken,
    { method: "DELETE" },
  );
}

export async function deleteNurseCommunity(
  accessToken: string,
  id: string,
): Promise<void> {
  return authedVoid(`/community/nurse-communities/${id}`, accessToken, {
    method: "DELETE",
  });
}

export async function fetchNurseCommunityChatHistory(
  accessToken: string,
  communityId: string,
  limit = 100,
): Promise<CommunityChatMessage[]> {
  const q = new URLSearchParams({ limit: String(limit) });
  const raw = await authedJson<unknown>(
    `/community/nurse-communities/${communityId}/chat/history?${q}`,
    accessToken,
    { method: "GET" },
  );
  return Array.isArray(raw) ? (raw as CommunityChatMessage[]) : [];
}

export async function uploadNurseCommunityImage(
  accessToken: string,
  communityId: string,
  file: File,
): Promise<{ imageUrl: string }> {
  const fd = new FormData();
  fd.append("file", file);
  return authedMultipartJson<{ imageUrl: string }>(
    `/community/nurse-communities/${communityId}/image`,
    accessToken,
    fd,
  );
}

/**
 * Latest `createdAt` (ms) from a message sent by someone other than `userId` in
 * all nurse sub-communities the user can read (member/owner, or all as super admin).
 * Used for unread indicators where group chat is split per community.
 */
export async function latestNurseCommunitiesPeerMessageMs(
  accessToken: string,
  myUserId: string,
  role: string,
  afterMs: number,
): Promise<number> {
  if (role !== "nurse" && role !== "super_admin") {
    return 0;
  }
  let list: NurseCommunityListItem[] = [];
  try {
    const r = await listNurseCommunities(accessToken);
    list = r.items;
  } catch {
    return 0;
  }

  const toPoll: NurseCommunityListItem[] =
    role === "super_admin"
      ? list
      : list.filter((c) => c.isMember || c.isOwner);

  let max = 0;
  for (const comm of toPoll) {
    try {
      const hist = await fetchNurseCommunityChatHistory(
        accessToken,
        comm.id,
        150,
      );
      for (const m of hist) {
        if (m.senderUserId === myUserId) continue;
        const t = new Date(m.createdAt).getTime();
        if (t > afterMs && t > max) {
          max = t;
        }
      }
    } catch {
      /* 403, etc. */
    }
  }
  return max;
}
