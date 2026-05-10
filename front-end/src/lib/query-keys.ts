/** Centralized TanStack Query keys for deduplication and targeted invalidation. */

export const queryKeys = {
  employerBootstrap: (userId: string | undefined) =>
    ["employer-bootstrap", userId ?? ""] as const,
  notificationsUnread: (userId: string | undefined) =>
    ["notifications-unread", userId ?? ""] as const,
  notificationsList: (userId: string | undefined) =>
    ["notifications-list", userId ?? ""] as const,
};
