"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";

import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { useAuth } from "@/contexts/auth-context";
import {
  listNotifications,
  markNotificationRead,
  type NotificationRow,
} from "@/lib/api/notifications-api";
import { queryKeys } from "@/lib/query-keys";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, user, ready } = useAuth();

  const listQuery = useQuery({
    queryKey: queryKeys.notificationsList(user?.id),
    queryFn: () => listNotifications(accessToken!),
    enabled: ready && Boolean(accessToken) && Boolean(user),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(accessToken!, id),
    onSuccess: () => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.notificationsUnread(user.id),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.notificationsList(user.id),
        });
      }
    },
  });

  useEffect(() => {
    if (!ready) return;
    if (!accessToken || !user) {
      router.replace("/sign-in?next=/notifications");
    }
  }, [ready, accessToken, user, router]);

  if (!ready) {
    return (
      <main className="min-h-[50vh] bg-slate-50 py-12">
        <SiteContentWrapper>
          <div className="flex justify-center py-20 text-slate-500">
            <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          </div>
        </SiteContentWrapper>
      </main>
    );
  }

  if (!accessToken || !user) {
    return (
      <main className="min-h-[40vh] bg-slate-50 py-12">
        <SiteContentWrapper>
          <p className="text-center text-slate-600">Redirecting to sign in…</p>
        </SiteContentWrapper>
      </main>
    );
  }

  const items: NotificationRow[] = listQuery.data ?? [];

  return (
    <main className="min-h-screen bg-slate-50 py-10 md:py-14">
      <SiteContentWrapper className="max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Bell className="h-6 w-6" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              Notifications
            </h1>
            <p className="text-sm text-slate-500">
              Updates on applications, messages, and community activity.
            </p>
          </div>
        </div>

        {listQuery.isPending ? (
          <div className="flex justify-center py-16 text-slate-500">
            <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          </div>
        ) : listQuery.isError ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            Could not load notifications. Try again later.
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-slate-600">
            <p className="font-medium text-slate-800">You&apos;re all caught up</p>
            <p className="mt-2 text-sm">No notifications yet.</p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  disabled={markReadMutation.isPending}
                  onClick={() => {
                    if (!n.read) {
                      markReadMutation.mutate(n.id);
                    }
                  }}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    n.read
                      ? "border-slate-100 bg-white"
                      : "border-red-100 bg-red-50/50 ring-1 ring-red-100"
                  } hover:border-red-200 hover:bg-red-50/30 disabled:opacity-70`}
                >
                  <p className="font-bold text-slate-900">{n.title}</p>
                  {n.body ? (
                    <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-400">{formatWhen(n.createdAt)}</p>
                  {!n.read ? (
                    <p className="mt-2 text-xs font-semibold text-red-600">Tap to mark as read</p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SiteContentWrapper>
    </main>
  );
}
