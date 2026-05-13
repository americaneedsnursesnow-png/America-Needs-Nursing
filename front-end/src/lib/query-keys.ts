/** Centralized TanStack Query keys for deduplication and targeted invalidation. */

export const queryKeys = {
  companyBootstrap: (userId: string | undefined) =>
    ["company-bootstrap", userId ?? ""] as const,
  notificationsUnread: (userId: string | undefined) =>
    ["notifications-unread", userId ?? ""] as const,
  notificationsList: (userId: string | undefined) =>
    ["notifications-list", userId ?? ""] as const,
};
