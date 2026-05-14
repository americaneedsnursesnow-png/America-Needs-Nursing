import { authedJson } from "./authed-client";

export type NewsletterMailStatus = {
  outboundEmailConfigured: boolean;
};

export type NewsletterBroadcastStatus = "pending" | "sent" | "failed";

export type NewsletterBroadcastListItem = {
  id: string;
  subject: string;
  status: NewsletterBroadcastStatus;
  scheduledAt: string;
  sentAt: string | null;
  recipientCount: number | null;
  failureReason: string | null;
  createdAt: string;
};

export type BroadcastNewsletterBody = {
  subject: string;
  html: string;
  /** ISO-8601 UTC; omit for send immediately. */
  scheduledAt?: string;
};

export type BroadcastNewsletterResult = {
  queued: true;
  broadcastId: string;
  jobId: string;
  scheduledAt: string;
  status: NewsletterBroadcastStatus;
};

export async function getNewsletterMailStatus(
  accessToken: string,
): Promise<NewsletterMailStatus> {
  return authedJson<NewsletterMailStatus>("/newsletter/admin/mail-status", accessToken, {
    method: "GET",
  });
}

export type NewsletterBroadcastsMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type NewsletterBroadcastsPage = {
  items: NewsletterBroadcastListItem[];
  meta: NewsletterBroadcastsMeta;
};

export type ListNewsletterBroadcastsParams = {
  page?: number;
  /** Page size (default 10, max 50). */
  limit?: number;
};

export async function listNewsletterBroadcasts(
  accessToken: string,
  params?: ListNewsletterBroadcastsParams,
): Promise<NewsletterBroadcastsPage> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const qs = new URLSearchParams({
    page: String(Math.max(1, page)),
    limit: String(Math.min(50, Math.max(1, limit))),
  });
  return authedJson<NewsletterBroadcastsPage>(`/newsletter/admin/broadcasts?${qs}`, accessToken, {
    method: "GET",
  });
}

export async function rescheduleNewsletterBroadcast(
  accessToken: string,
  broadcastId: string,
  scheduledAtIso: string,
): Promise<{ ok: true; broadcastId: string; jobId: string; scheduledAt: string }> {
  return authedJson<{ ok: true; broadcastId: string; jobId: string; scheduledAt: string }>(
    `/newsletter/admin/broadcasts/${encodeURIComponent(broadcastId)}/schedule`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify({ scheduledAt: scheduledAtIso }),
    },
  );
}

export async function broadcastNewsletter(
  accessToken: string,
  body: BroadcastNewsletterBody,
): Promise<BroadcastNewsletterResult> {
  return authedJson<BroadcastNewsletterResult>(
    "/newsletter/admin/broadcast",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
