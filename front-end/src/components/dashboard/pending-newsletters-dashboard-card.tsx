"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2, Mail } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { canAccessBlogNewsletterAdmin } from "@/lib/api/auth-api";
import {
  listNewsletterBroadcasts,
  type NewsletterBroadcastListItem,
} from "@/lib/api/newsletter-admin-api";

function formatScheduled(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function PendingNewslettersDashboardCard() {
  const { accessToken, ready, user } = useAuth();
  const [pending, setPending] = useState<NewsletterBroadcastListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken || !user || !canAccessBlogNewsletterAdmin(user.role)) {
      setPending([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await listNewsletterBroadcasts(accessToken, { page: 1, limit: 200 });
      const p = res.items
        .filter((r) => r.status === "pending")
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      setPending(p);
    } catch {
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, user]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  if (!ready || !user || !canAccessBlogNewsletterAdmin(user.role)) {
    return null;
  }

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
            <Mail size={20} aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Pending newsletters</h2>
            <p className="text-xs text-slate-500">
              {loading
                ? "Loading…"
                : pending.length === 0
                  ? "Nothing scheduled to send."
                  : `${pending.length} waiting to send`}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/admin/newsletter"
          className="text-sm font-semibold text-red-600 transition hover:text-red-700"
        >
          Manage newsletters
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-red-600" aria-hidden />
          Loading queue…
        </div>
      ) : pending.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-600">
          When you queue a broadcast from the newsletter screen, it appears here until it is sent or fails.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {pending.slice(0, 8).map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
              <p className="min-w-0 flex-1 truncate font-medium text-slate-900">{row.subject}</p>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500">
                <CalendarClock size={14} className="text-slate-400" aria-hidden />
                {formatScheduled(row.scheduledAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!loading && pending.length > 8 ? (
        <p className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-500">
          +{pending.length - 8} more on the newsletter page
        </p>
      ) : null}
    </div>
  );
}
