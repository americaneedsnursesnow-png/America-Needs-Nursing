"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import { canAccessCommunity } from "@/lib/api/auth-api";
import { latestGlobalChatPeerTimeMs } from "@/lib/api/community-group-chat-api";
import { latestNurseCommunitiesPeerMessageMs } from "@/lib/api/nurse-communities-api";
import {
  listMessagingThreads,
  listThreadMessages,
} from "@/lib/api/messaging-api";

const POLL_MS = 22_000;

function isCommunityHubPath(p: string): boolean {
  if (!p) return false;
  return (
    p === "/community" ||
    p.startsWith("/community/") ||
    p === "/dashboard/admin/community" ||
    p.startsWith("/dashboard/admin/community/")
  );
}

function isJobMessagesHubPath(p: string): boolean {
  if (!p) return false;
  return (
    p === "/dashboard/employee/messages" ||
    p.startsWith("/dashboard/employee/messages/")
  );
}

/** Nurse messaging hub: `/community/messages?tab=inbox` is employer threads — not community chat. */
function clearsCommunityVisit(pathname: string, hubTab: string | null): boolean {
  if (!isCommunityHubPath(pathname)) return false;
  if (pathname === "/community/messages" && hubTab === "inbox") return false;
  return true;
}

function clearsJobMessagesVisit(pathname: string, hubTab: string | null): boolean {
  if (isJobMessagesHubPath(pathname)) return true;
  if (pathname === "/community/messages" && hubTab === "inbox") return true;
  return false;
}

function communityReadKey(userId: string): string {
  return `ann_community_chat_last_read:${userId}`;
}

function jobMessagesReadKey(userId: string): string {
  return `ann_job_messages_last_read:${userId}`;
}

function readStoredIsoMs(key: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}

function writeStoredNow(key: string): void {
  localStorage.setItem(key, new Date().toISOString());
}

/** One-time: older builds used a single visit key for both surfaces. */
function migrateLegacyVisitKeys(userId: string): void {
  if (typeof window === "undefined") return;
  const legacyKey = `ann_community_hub_last_visit:${userId}`;
  const raw = localStorage.getItem(legacyKey);
  if (!raw) return;
  const c = communityReadKey(userId);
  const j = jobMessagesReadKey(userId);
  if (!localStorage.getItem(c)) localStorage.setItem(c, raw);
  if (!localStorage.getItem(j)) localStorage.setItem(j, raw);
}

/** Latest timestamp (ms) of a job-thread message from someone else, after `afterMs`. */
async function latestIncomingJobMessageMs(
  token: string,
  userId: string,
  role: string,
  afterMs: number,
): Promise<number> {
  if (role !== "nurse" && role !== "employer" && role !== "admin") return 0;
  let max = 0;
  try {
    const threads = await listMessagingThreads(token);
    const hot = threads
      .filter(
        (t) =>
          t.lastMessageAt &&
          new Date(t.lastMessageAt).getTime() > afterMs,
      )
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt!).getTime() -
          new Date(a.lastMessageAt!).getTime(),
      )
      .slice(0, 10);
    await Promise.all(
      hot.map(async (t) => {
        try {
          const msgs = await listThreadMessages(token, t.applicationId);
          const last = msgs.at(-1);
          if (!last || last.senderUserId === userId) return;
          const x = new Date(last.createdAt).getTime();
          if (x > afterMs && x > max) max = x;
        } catch {
          /* ignore */
        }
      }),
    );
  } catch {
    /* 403 etc. */
  }
  return max;
}

/** Latest timestamp (ms) of a community group message from someone else, after `afterMs`. */
async function latestIncomingCommunityMs(
  token: string,
  userId: string,
  role: string,
  afterMs: number,
): Promise<number> {
  if (role !== "nurse" && role !== "super_admin") return 0;
  try {
    const [a, b] = await Promise.all([
      latestNurseCommunitiesPeerMessageMs(
        token,
        userId,
        role,
        afterMs,
      ),
      latestGlobalChatPeerTimeMs(token, userId, afterMs),
    ]);
    return Math.max(a, b);
  } catch {
    return 0;
  }
}

export type CommunityHubUnreadContextValue = {
  /** New community group chat since last read (nurse / super_admin). */
  communityUnread: boolean;
  /** New employer↔nurse thread activity since last visit to Messages (nurse / employer / admin). */
  messagesUnread: boolean;
  /** @deprecated use communityUnread || messagesUnread */
  hubUnread: boolean;
};

const CommunityHubUnreadContext = createContext<CommunityHubUnreadContextValue>(
  {
    communityUnread: false,
    messagesUnread: false,
    hubUnread: false,
  },
);

export function useCommunityHubUnread(): CommunityHubUnreadContextValue {
  return useContext(CommunityHubUnreadContext);
}

function CommunityHubUnreadProviderInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const hubTab = searchParams.get("tab");
  const { user, accessToken, ready } = useAuth();
  const [communityUnread, setCommunityUnread] = useState(false);
  const [messagesUnread, setMessagesUnread] = useState(false);

  const canPollCommunity = useMemo(
    () =>
      Boolean(
        ready &&
          user?.id &&
          accessToken &&
          canAccessCommunity(user.role, {
            communityBannedAt: user.communityBannedAt,
          }),
      ),
    [ready, user?.id, accessToken, user?.role, user?.communityBannedAt],
  );

  const canPollMessages = useMemo(
    () =>
      Boolean(
        ready &&
          user?.id &&
          accessToken &&
          (user.role === "nurse" ||
            user.role === "employer" ||
            user.role === "admin"),
      ),
    [ready, user?.id, accessToken, user?.role],
  );

  useEffect(() => {
    if (!user?.id) return;
    if (clearsCommunityVisit(pathname, hubTab)) {
      writeStoredNow(communityReadKey(user.id));
      setCommunityUnread(false);
    }
  }, [pathname, hubTab, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (clearsJobMessagesVisit(pathname, hubTab)) {
      writeStoredNow(jobMessagesReadKey(user.id));
      setMessagesUnread(false);
    }
  }, [pathname, hubTab, user?.id]);

  const poll = useCallback(async () => {
    if (!user?.id || !accessToken) {
      setCommunityUnread(false);
      setMessagesUnread(false);
      return;
    }

    const uid = user.id;
    migrateLegacyVisitKeys(uid);

    if (canPollCommunity) {
      if (clearsCommunityVisit(pathname, hubTab)) {
        setCommunityUnread(false);
      } else {
        const lastRead =
          readStoredIsoMs(communityReadKey(uid)) ?? 0;
        const commTs = await latestIncomingCommunityMs(
          accessToken,
          uid,
          user.role,
          lastRead,
        );
        setCommunityUnread(commTs > lastRead);
      }
    } else {
      setCommunityUnread(false);
    }

    if (canPollMessages) {
      if (clearsJobMessagesVisit(pathname, hubTab)) {
        setMessagesUnread(false);
      } else {
        const lastRead = readStoredIsoMs(jobMessagesReadKey(uid)) ?? 0;
        const jobTs = await latestIncomingJobMessageMs(
          accessToken,
          uid,
          user.role,
          lastRead,
        );
        setMessagesUnread(jobTs > lastRead);
      }
    } else {
      setMessagesUnread(false);
    }
  }, [
    user?.id,
    user?.role,
    accessToken,
    pathname,
    hubTab,
    canPollCommunity,
    canPollMessages,
  ]);

  useEffect(() => {
    if (!canPollCommunity && !canPollMessages) {
      setCommunityUnread(false);
      setMessagesUnread(false);
      return;
    }
    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => window.clearInterval(id);
  }, [canPollCommunity, canPollMessages, poll]);

  const value = useMemo(
    () => ({
      communityUnread,
      messagesUnread,
      hubUnread: communityUnread || messagesUnread,
    }),
    [communityUnread, messagesUnread],
  );

  return (
    <CommunityHubUnreadContext.Provider value={value}>
      {children}
    </CommunityHubUnreadContext.Provider>
  );
}

export function CommunityHubUnreadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense
      fallback={
        <CommunityHubUnreadContext.Provider
          value={{
            communityUnread: false,
            messagesUnread: false,
            hubUnread: false,
          }}
        >
          {children}
        </CommunityHubUnreadContext.Provider>
      }
    >
      <CommunityHubUnreadProviderInner>{children}</CommunityHubUnreadProviderInner>
    </React.Suspense>
  );
}
