import { authedJson } from "./authed-client";

export type NotificationRow = {
  id: string;
  clientName: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export async function getNotificationsUnreadCount(
  accessToken: string,
): Promise<number> {
  const res = await authedJson<{ count: number }>(
    "/notifications/unread-count",
    accessToken,
    { method: "GET" },
  );
  return typeof res.count === "number" ? res.count : 0;
}

export async function listNotifications(
  accessToken: string,
): Promise<NotificationRow[]> {
  return authedJson<NotificationRow[]>("/notifications", accessToken, {
    method: "GET",
  });
}

export async function markNotificationRead(
  accessToken: string,
  id: string,
): Promise<void> {
  await authedJson<unknown>(`/notifications/${encodeURIComponent(id)}/read`, accessToken, {
    method: "PATCH",
  });
}
