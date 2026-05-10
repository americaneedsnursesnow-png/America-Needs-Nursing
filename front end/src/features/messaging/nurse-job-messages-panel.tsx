"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { MessagesSquare, Search, Send, Users } from "lucide-react";
import { CommunityGroupChat } from "@/features/community/community-group-chat";
import { useAuth } from "@/contexts/auth-context";
import { canAccessCommunity } from "@/lib/api/auth-api";
import { BackendRequestError } from "@/lib/api/authed-client";
import {
  fetchGlobalMentionRows,
  latestGlobalChatPeerTimeMs,
} from "@/lib/api/community-group-chat-api";
import {
  listMessagingThreads,
  sendThreadMessage,
  type MessagingThread,
  type ThreadMessage,
} from "@/lib/api/messaging-api";
import { listMyApplications } from "@/lib/api/nurse-jobs-api";
import { appendThreadMessageIfNew } from "@/features/messaging/thread-messages-dedupe";
import { useThreadMessagesRealtime } from "@/features/messaging/use-thread-messages-realtime";

type ThreadRow = {
  applicationId: string;
  lastMessageAt: string | null;
  label: string;
};

function formatMsgTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/** Only threads the API exposes (employer has messaged first) appear in the nurse sidebar. */
async function buildNurseThreadRows(
  token: string,
  apiThreads: MessagingThread[],
): Promise<ThreadRow[]> {
  const apps = await listMyApplications(token);
  const appById = new Map(apps.map((a) => [a.id, a] as const));
  const rows: ThreadRow[] = [];
  for (const t of apiThreads) {
    const a = appById.get(t.applicationId);
    if (!a) continue;
    rows.push({
      applicationId: t.applicationId,
      lastMessageAt: t.lastMessageAt,
      label: `${a.job?.title ?? "Job"} · ${a.job?.company?.name ?? "Company"}`,
    });
  }
  rows.sort((x, y) => {
    const tx = x.lastMessageAt ? new Date(x.lastMessageAt).getTime() : 0;
    const ty = y.lastMessageAt ? new Date(y.lastMessageAt).getTime() : 0;
    return ty - tx;
  });
  return rows;
}

type Props = {
  accessToken: string;
  userId: string;
  /** Full dashboard page vs compact block inside community */
  variant?: "page" | "embedded";
  /** Select thread when opening from a link (e.g. `?applicationId=`). */
  initialApplicationId?: string | null;
  /**
   * When true (nurse community shell), sidebar includes **Community**; choosing it opens
   * group chat in the same right-hand pane as employer threads (`?pane=community`).
   */
  includeCommunityChat?: boolean;
};

type SidebarMode = "threads" | "community";

function embedCommunityVisitKey(uid: string): string {
  return `ann_embed_community_visit:${uid}`;
}

export function NurseJobMessagesPanel({
  accessToken,
  userId,
  variant = "page",
  initialApplicationId = null,
  includeCommunityChat = false,
}: Props) {
  const { user } = useAuth();
  const showCommunitySidebar =
    includeCommunityChat &&
    canAccessCommunity(user?.role ?? "employer", {
      communityBannedAt: user?.communityBannedAt,
    });
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [embedCommunityUnread, setEmbedCommunityUnread] = useState(false);
  const [embedGlobalMentionRows, setEmbedGlobalMentionRows] = useState<
    Awaited<ReturnType<typeof fetchGlobalMentionRows>>
  >([]);
  const lastEmbedMentionsKey = useRef<string | null>(null);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("threads");
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    if (!accessToken) return;
    setLoadingThreads(true);
    setError(null);
    try {
      const raw = await listMessagingThreads(accessToken);
      const rows = await buildNurseThreadRows(accessToken, raw);
      setThreads(rows);
      setActiveApplicationId((prev) => {
        if (rows.length === 0) return null;
        if (prev && rows.some((r) => r.applicationId === prev)) return prev;
        return rows[0].applicationId;
      });
    } catch (e) {
      setError(
        e instanceof BackendRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load conversations.",
      );
    } finally {
      setLoadingThreads(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!accessToken || !showCommunitySidebar) {
      lastEmbedMentionsKey.current = null;
      return;
    }
    const k = `${userId}:mentions`;
    if (lastEmbedMentionsKey.current === k) {
      return;
    }
    lastEmbedMentionsKey.current = k;
    let cancel = false;
    void (async () => {
      try {
        const m = await fetchGlobalMentionRows(accessToken);
        if (!cancel) {
          setEmbedGlobalMentionRows(m);
        }
      } catch {
        if (!cancel) {
          setEmbedGlobalMentionRows([]);
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [accessToken, showCommunitySidebar, userId]);

  useEffect(() => {
    if (!showCommunitySidebar) {
      setSidebarMode("threads");
    }
  }, [showCommunitySidebar]);

  useEffect(() => {
    if (!showCommunitySidebar) {
      setEmbedCommunityUnread(false);
      return;
    }
    if (sidebarMode === "community") {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          embedCommunityVisitKey(userId),
          new Date().toISOString(),
        );
      }
      setEmbedCommunityUnread(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        let afterMs = 0;
        if (typeof window !== "undefined") {
          const raw = sessionStorage.getItem(embedCommunityVisitKey(userId));
          if (raw) {
            const t = Date.parse(raw);
            if (Number.isFinite(t)) afterMs = t;
          }
        }
        if (afterMs === 0) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              embedCommunityVisitKey(userId),
              new Date().toISOString(),
            );
          }
          if (!cancelled) setEmbedCommunityUnread(false);
          return;
        }
        const latest = await latestGlobalChatPeerTimeMs(
          accessToken,
          userId,
          afterMs,
        );
        if (!cancelled) setEmbedCommunityUnread(latest > afterMs);
      } catch {
        if (!cancelled) setEmbedCommunityUnread(false);
      }
    };

    void run();
    const id = window.setInterval(() => void run(), 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [showCommunitySidebar, sidebarMode, accessToken, userId, user?.role]);

  useEffect(() => {
    if (!initialApplicationId || threads.length === 0) return;
    if (threads.some((t) => t.applicationId === initialApplicationId)) {
      setSidebarMode("threads");
      setActiveApplicationId(initialApplicationId);
    }
  }, [initialApplicationId, threads]);

  const threadRealtimeEnabled =
    !showCommunitySidebar || sidebarMode === "threads";

  useThreadMessagesRealtime(
    accessToken,
    activeApplicationId,
    threadRealtimeEnabled,
    setMessages,
    setLoadingMessages,
  );

  useEffect(() => {
    if (!accessToken) return;
    const id = window.setInterval(() => {
      void loadThreads();
    }, 12_000);
    return () => window.clearInterval(id);
  }, [accessToken, loadThreads]);

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accessToken || !activeApplicationId || !inputValue.trim()) return;
    setSending(true);
    setError(null);
    try {
      const msg = await sendThreadMessage(
        accessToken,
        activeApplicationId,
        inputValue.trim(),
      );
      setMessages((prev) => appendThreadMessageIfNew(prev, msg));
      setInputValue("");
      void loadThreads();
    } catch (err) {
      setError(
        err instanceof BackendRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Send failed.",
      );
    } finally {
      setSending(false);
    }
  }

  const filteredThreads = threads.filter((t) =>
    t.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const activeThread = threads.find((t) => t.applicationId === activeApplicationId);

  const outerClass =
    variant === "page"
      ? "box-border flex min-h-screen w-full flex-col overflow-hidden border border-gray-100 bg-white shadow-sm"
      : showCommunitySidebar
        ? "flex h-[min(36rem,79vh)] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:h-[32rem] md:h-[36rem] lg:h-[min(40rem,80vh)]"
        : "flex h-[min(32rem,70vh)] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:h-[28rem] md:h-[32rem]";

  return (
    <div className={outerClass}>
      
       
      

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex max-h-[50%] w-full flex-col border-b border-gray-100 bg-gray-50/30 md:max-h-none md:w-[min(100%,20rem)] ">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search by community or job name…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-red-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="community-msg-scrollbar min-h-0 flex-1 overflow-y-auto">
            {showCommunitySidebar ? (
              <div className="border-b border-gray-100 p-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem(
                        embedCommunityVisitKey(userId),
                        new Date().toISOString(),
                      );
                    }
                    setEmbedCommunityUnread(false);
                    setSidebarMode("community");
                  }}
                  className={`relative flex w-full items-start gap-2 rounded-xl border-l-4 px-3 py-3 text-left transition-all ${
                    sidebarMode === "community"
                      ? "border-red-500 bg-amber-50/90"
                      : "border-transparent hover:bg-gray-100/80"
                  }`}
                >
                  <Users
                    className="mt-0.5 size-5 shrink-0 text-amber-700"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="block font-bold text-gray-900">
                        Community
                      </span>
                      {embedCommunityUnread ? (
                        <span
                          className="size-2 shrink-0 rounded-full bg-red-600"
                          aria-label="New group chat messages"
                        />
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-medium leading-snug text-gray-600">
                      Group chat with other nurses
                    </span>
                  </span>
                </button>
                <div className="my-2 flex items-center gap-2 px-2">
                  <MessagesSquare className="size-3.5 text-gray-400" aria-hidden />
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    Employer messages
                  </span>
                </div>
              </div>
            ) : null}
            {loadingThreads ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                Loading…
              </p>
            ) : filteredThreads.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                No employer messages yet. A company shows up here only after
                they send you the first message about an application.
              </p>
            ) : (
              filteredThreads.map((t) => (
                <button
                  key={t.applicationId}
                  type="button"
                  onClick={() => {
                    setSidebarMode("threads");
                    setActiveApplicationId(t.applicationId);
                  }}
                  className={`w-full border-l-4 px-3 py-3 text-left text-sm transition-all ${
                    sidebarMode === "threads" &&
                    activeApplicationId === t.applicationId
                      ? "border-[var(--color-button)] bg-white"
                      : "border-transparent hover:bg-gray-100/80"
                  }`}
                >
                  <p className="font-bold text-gray-900">{t.label}</p>
                  {t.lastMessageAt ? (
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {formatMsgTime(t.lastMessageAt)}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      No messages yet
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
          {showCommunitySidebar && sidebarMode === "community" ? (
            <>
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-bold text-gray-900">
                  Nurse community chat
                </h2>
                <p className="mt-0.5 text-xs text-red-500">
                  Open discussion with other nurses. Keep it professional and respectful.
                </p>
              </div>
              <div className="community-msg-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
                <CommunityGroupChat
                  accessToken={accessToken}
                  userId={userId}
                  viewerRole={user?.role}
                  roomMode="global"
                  communityName="Nurse community"
                  members={embedGlobalMentionRows.map((r) => ({
                    userId: r.userId,
                    email: r.email,
                    fullName: r.fullName,
                    joinedAt: new Date(0).toISOString(),
                  }))}
                />
              </div>
            </>
          ) : (
            <>
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-bold text-gray-900">
                  {activeThread?.label ?? "Select a conversation"}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Messages with the employer about this application.
                </p>
              </div>

              <div className="community-msg-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto bg-gray-50/40 p-4">
                {loadingMessages ? (
                  <p className="text-sm text-gray-500">Loading messages…</p>
                ) : messages.length === 0 && activeApplicationId ? (
                  <p className="text-sm text-gray-500">
                    No messages yet. Say hello or wait for the employer to reply.
                  </p>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderUserId === userId;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            mine
                              ? "rounded-tr-none text-white"
                              : "rounded-tl-none border border-gray-100 bg-white text-gray-700"
                          }`}
                          style={
                            mine
                              ? { backgroundColor: "var(--color-button)" }
                              : undefined
                          }
                        >
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p
                            className={`mt-1 text-[10px] ${mine ? "text-white/80" : "text-gray-400"}`}
                          >
                            {formatMsgTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-gray-100 bg-white p-3">
                <form
                  onSubmit={(e) => void handleSend(e)}
                  className="flex items-center gap-2  border border-gray-200 bg-gray-50 p-1"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      activeApplicationId
                        ? "Reply to employer…"
                        : "Select a job thread"
                    }
                    disabled={!activeApplicationId || sending}
                    className="min-w-0 flex-1 border-none bg-transparent px-2 py-1.5 text-sm text-gray-700 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={
                      !activeApplicationId || sending || !inputValue.trim()
                    }
                    className="flex items-center justify-center rounded-md p-2 text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-button)" }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        .community-msg-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .community-msg-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .community-msg-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
