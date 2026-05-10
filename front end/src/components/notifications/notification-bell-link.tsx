"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { useNotificationsUnreadCount } from "@/hooks/use-notifications-unread-count";

type NotificationBellLinkProps = {
  className?: string;
};

export function NotificationBellLink({ className = "" }: NotificationBellLinkProps) {
  const { data: unread = 0, isPending } = useNotificationsUnreadCount();
  const hasUnread = !isPending && unread > 0;

  return (
    <Link
      href="/notifications"
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 ${className}`}
      aria-label={
        hasUnread
          ? `Notifications, ${unread} unread`
          : "Notifications"
      }
    >
      <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
      {hasUnread ? (
        <span
          className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-600 ring-2 ring-white"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}
