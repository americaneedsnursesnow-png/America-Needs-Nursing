import { authedJson } from "./authed-client";

export type BroadcastNewsletterBody = {
  subject: string;
  html: string;
};

export type BroadcastNewsletterResult = {
  queued: true;
  jobId: string;
};

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
