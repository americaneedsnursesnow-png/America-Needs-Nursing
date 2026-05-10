import { authedJson } from "./authed-client";
import { spacingFetch } from "./api-request-spacing";
import { getApiBaseUrl, getPublicClientName } from "./env";

export type CommunityPost = {
  id: string;
  clientName: string;
  authorUserId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityComment = {
  id: string;
  postId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
};

function publicCommunityQuery(): string {
  return `clientName=${encodeURIComponent(getPublicClientName())}`;
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || res.statusText);
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return [] as T;
  }
  return JSON.parse(trimmed) as T;
}

export async function listCommunityPosts(): Promise<CommunityPost[]> {
  const res = await spacingFetch(
    `${getApiBaseUrl()}/community/posts?${publicCommunityQuery()}`,
    { headers: { Accept: "application/json" } },
  );
  return readJson<CommunityPost[]>(res);
}

export async function listCommunityComments(
  postId: string,
): Promise<CommunityComment[]> {
  const res = await spacingFetch(
    `${getApiBaseUrl()}/community/posts/${encodeURIComponent(postId)}/comments?${publicCommunityQuery()}`,
    { headers: { Accept: "application/json" } },
  );
  return readJson<CommunityComment[]>(res);
}

export async function createCommunityPost(
  accessToken: string,
  input: { title: string; body: string },
): Promise<CommunityPost> {
  return authedJson<CommunityPost>("/community/posts", accessToken, {
    method: "POST",
    body: JSON.stringify({
      title: input.title.trim(),
      body: input.body.trim(),
    }),
  });
}

export async function createCommunityComment(
  accessToken: string,
  postId: string,
  input: { body: string },
): Promise<CommunityComment> {
  return authedJson<CommunityComment>(
    `/community/posts/${encodeURIComponent(postId)}/comments`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ body: input.body.trim() }),
    },
  );
}

export async function reportCommunityMember(
  accessToken: string,
  input: { reportedUserId: string; reason?: string },
): Promise<{
  ok: true;
  distinctReporterCount: number;
  escalatedToAdmins: boolean;
}> {
  return authedJson(
    "/community/members/report",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        reportedUserId: input.reportedUserId,
        ...(input.reason !== undefined && input.reason.trim()
          ? { reason: input.reason.trim() }
          : {}),
      }),
    },
  );
}
