"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/auth-context";
import { getNotificationsUnreadCount } from "@/lib/api/notifications-api";
import { queryKeys } from "@/lib/query-keys";

/**
 * Polls lightweight unread count for header/sidebar badge (all authenticated roles).
 */
export function useNotificationsUnreadCount() {
  const { accessToken, user, ready } = useAuth();
  const enabled = ready && Boolean(accessToken) && Boolean(user);

  return useQuery({
    queryKey: queryKeys.notificationsUnread(user?.id),
    queryFn: () => getNotificationsUnreadCount(accessToken!),
    enabled,
    staleTime: 30_000,
    refetchInterval: 90_000,
    refetchOnWindowFocus: true,
  });
}
