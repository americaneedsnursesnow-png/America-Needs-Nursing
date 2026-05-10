"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { MessagesSquare, Users } from "lucide-react";

import { NurseJobMessagesPanel } from "@/features/messaging";
import { useAuth } from "@/contexts/auth-context";
import { CommunityNursePage } from "@/features/community/community-nurse-page";

type HubTab = "community" | "inbox";

function tabFromSearch(raw: string | null): HubTab {
  return raw === "inbox" ? "inbox" : "community";
}

function HubTabLink({
  href,
  active,
  icon: Icon,
  label,
  sub,
}: {
  href: string;
  active: boolean;
  icon: typeof Users;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
        active
          ? "bg-red-50 text-red-900 ring-1 ring-red-100"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon
        className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-red-600" : "text-slate-400"}`}
        aria-hidden
      />
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
          {sub}
        </span>
      </span>
    </Link>
  );
}

/**
 * Single nurse “Community” area: sidebar tabs like a messaging app — rooms vs employer inbox.
 */
export function CommunityMessagingHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = tabFromSearch(searchParams.get("tab"));
  const { user, accessToken, ready } = useAuth();

  useEffect(() => {
    if (!ready || !user) return;
    if (user.role === "super_admin") {
      router.replace("/dashboard/admin/community");
      return;
    }
    if (user.role !== "nurse") {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 text-slate-500">
        Loading…
      </div>
    );
  }

  if (user.role !== "nurse" || !accessToken) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-slate-50 text-slate-500">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-50 text-slate-900">
      <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-orange-400" />
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col min-h-0 lg:flex-row">
        <aside className="shrink-0 border-slate-200 bg-white lg:w-64 lg:border-r lg:shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 lg:block">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Messages
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              Community hub
            </p>
          </div>
          <nav
            className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:gap-1 lg:overflow-visible lg:p-2"
            aria-label="Community messaging sections"
          >
            <HubTabLink
              href="/community/messages"
              active={tab === "community"}
              icon={Users}
              label="Community"
              sub="Group chats & nurse rooms"
            />
            <HubTabLink
              href="/community/messages?tab=inbox"
              active={tab === "inbox"}
              icon={MessagesSquare}
              label="Inbox"
              sub="Employers & applications"
            />
          </nav>
        </aside>

        <section className="min-h-0 min-w-0 flex-1 overflow-hidden bg-white lg:border-l lg:border-slate-100">
          {tab === "community" ? (
            <CommunityNursePage variant="hub" />
          ) : (
            <div className="flex h-full min-h-[520px] flex-col lg:min-h-[calc(100vh-6rem)]">
              <div className="border-b border-slate-100 px-4 py-3 sm:px-6">
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  Inbox
                </h2>
                <p className="text-xs text-slate-500">
                  Private threads with employers about your applications.
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden px-2 pb-2 pt-2 sm:px-4">
                <div className="h-full min-h-[480px] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 shadow-inner">
                  <NurseJobMessagesPanel
                    accessToken={accessToken}
                    userId={user.id}
                    variant="page"
                    initialApplicationId={null}
                    includeCommunityChat={false}
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
