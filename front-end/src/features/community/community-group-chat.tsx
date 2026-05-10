"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Socket } from "socket.io-client";

import { BackendRequestError } from "@/lib/api/authed-client";
import type { AuthUserRole } from "@/lib/api/auth-api";
import {
  type CommunityChatMessage,
  fetchGlobalCommunityChatHistory,
} from "@/lib/api/community-group-chat-api";
import { fetchNurseCommunityChatHistory } from "@/lib/api/nurse-communities-api";
import type { NurseCommunityMemberRow } from "@/lib/api/nurse-communities-api";
import { reportCommunityMember } from "@/lib/api/community-api";
import { getCommunityChatSocketTarget } from "@/lib/api/env";
import { acquirePooledSocket } from "@/lib/api/pooled-socket.client";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type SendAck =
  | { ok: true; message: CommunityChatMessage }
  | { ok: false; error: string };

function formatChatHistoryError(e: unknown): string {
  if (e instanceof BackendRequestError) return e.message;
  if (e instanceof Error) return e.message;
  return "Could not load chat history.";
}

function parseChatMessage(raw: unknown): CommunityChatMessage | null {
  if (!raw || typeof raw !== "object") return null;
    const m = raw as Record<string, unknown>;
  const id = String(m.id ?? "");
  const body = typeof m.body === "string" ? m.body : "";
  if (!id) return null;
  return {
    id,
    clientName: String(m.clientName ?? m.client_name ?? ""),
    nurseCommunityId:
      m.nurseCommunityId != null
        ? String(m.nurseCommunityId)
        : m.nurse_community_id != null
          ? String(m.nurse_community_id)
          : undefined,
    senderUserId: String(m.senderUserId ?? m.sender_user_id ?? ""),
    senderEmail: String(m.senderEmail ?? m.sender_email ?? ""),
    senderRole: String(m.senderRole ?? m.sender_role ?? ""),
    body,
    createdAt:
      typeof m.createdAt === "string" ? m.createdAt : new Date().toISOString(),
  };
}

type MentionBodyVariant = "default" | "onPrimary" | "onAdmin";

const MENTION_STYLES: Record<MentionBodyVariant, string> = {
  default: "text-indigo-200 font-bold bg-indigo-950/40 rounded px-0.5",
  onPrimary: "text-amber-200 font-extrabold",
  onAdmin: "text-amber-200 font-extrabold",
};

/** Renders @all and @email@... in message body (Discord-style). */
function MessageBodyText({
  text,
  variant = "default",
}: {
  text: string;
  variant?: MentionBodyVariant;
}) {
  const parts: React.ReactNode[] = [];
  const re = /(@all\b|@[\w.+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  re.lastIndex = 0;
  const s = text;
  const mentionClass = MENTION_STYLES[variant];
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      parts.push(<span key={key++}>{s.slice(last, m.index)}</span>);
    }
    parts.push(
      <span key={key++} className={mentionClass}>
        {m[1]}
      </span>,
    );
    last = m.index + m[1].length;
  }
  if (last < s.length) {
    parts.push(<span key={key++}>{s.slice(last)}</span>);
  }
  return <>{parts.length > 0 ? parts : text}</>;
}

type Props = {
  accessToken: string;
  userId: string;
  viewerRole?: AuthUserRole;
  /** `global` = main (legacy) all-nurses room; `nurse` = a nurse-created sub-community. */
  roomMode?: "nurse" | "global";
  /** Sub-community id; ignored when `roomMode` is `global`. */
  nurseCommunityId?: string;
  communityName: string;
  members: NurseCommunityMemberRow[];
  settingsHref?: string;
};

export function CommunityGroupChat({
  accessToken,
  userId,
  viewerRole,
  roomMode = "nurse",
  nurseCommunityId,
  communityName,
  members,
  settingsHref,
}: Props) {
  const isGlobal = roomMode === "global";
  const scopingKey = isGlobal
    ? "global"
    : (nurseCommunityId as string) || "";

  const [messages, setMessages] = useState<CommunityChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [wsState, setWsState] = useState<"connecting" | "live" | "disconnected">(
    "connecting",
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDoneNotice, setReportDoneNotice] = useState<string | null>(null);
  const [showMentionHint, setShowMentionHint] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRetryKey, setHistoryRetryKey] = useState(0);

  const canFileReports = viewerRole === "nurse" || viewerRole === "super_admin";
  const listRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const releaseSocketRef = useRef<(() => void) | null>(null);
  const idsRef = useRef<Set<string>>(new Set());
  const roomIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (!isGlobal && !nurseCommunityId) {
      setLoadingHistory(false);
      return;
    }
    setHistoryError(null);
    setLoadingHistory(true);
    let cancelled = false;
    void (async () => {
      try {
        const list = isGlobal
          ? await fetchGlobalCommunityChatHistory(accessToken, 100)
          : await fetchNurseCommunityChatHistory(
              accessToken,
              nurseCommunityId!,
              100,
            );
        if (cancelled) return;
        setMessages(list);
        idsRef.current = new Set(list.map((m) => m.id));
        setTimeout(scrollToBottom, 100);
        setHistoryError(null);
      } catch (e) {
        const msg = formatChatHistoryError(e);
        if (!cancelled) setHistoryError(msg);
        console.error("[CommunityGroupChat] history", e);
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    isGlobal,
    nurseCommunityId,
    scrollToBottom,
    historyRetryKey,
  ]);

  function requestJoinRoom(socket: Socket) {
    if (isGlobal) {
      socket.emit(
        "chat:join",
        { global: true },
        (ack: { ok: true; room: string; global: boolean; nurseCommunityId: null } | { ok: false; error: string }) => {
          if (ack && "ok" in ack && ack.ok) {
            roomIdRef.current = "global";
          } else if (ack && "ok" in ack && !ack.ok) {
            setSendError(ack.error ?? "Could not join channel");
          }
        },
      );
      return;
    }
    socket.emit(
      "chat:join",
      { nurseCommunityId },
      (ack: { ok: true; room: string; nurseCommunityId: string } | { ok: false; error: string }) => {
        if (ack && "ok" in ack && ack.ok) {
          roomIdRef.current = ack.nurseCommunityId;
        } else if (ack && "ok" in ack && !ack.ok) {
          setSendError(ack.error ?? "Could not join channel");
        }
      },
    );
  }

  useEffect(() => {
    const { url, path } = getCommunityChatSocketTarget();
    const { socket, release } = acquirePooledSocket(url, path, accessToken);
    socketRef.current = socket;
    releaseSocketRef.current = release;

    const onConnect = () => {
      setWsState("live");
      requestJoinRoom(socket);
    };
    const onDisconnect = () => setWsState("disconnected");
    const onMessage = (raw: unknown) => {
      const msg = parseChatMessage(raw);
      if (!msg) return;
      if (isGlobal) {
        if (msg.nurseCommunityId) return;
      } else if (
        msg.nurseCommunityId == null ||
        msg.nurseCommunityId !== nurseCommunityId
      ) {
        return;
      }
      if (msg && !idsRef.current.has(msg.id)) {
        setMessages((prev) => [...prev, msg]);
        idsRef.current.add(msg.id);
        setTimeout(scrollToBottom, 50);
      }
    };
    if (socket.connected) {
      onConnect();
    }
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("chat:message", onMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat:message", onMessage);
      try {
        socket.emit("chat:leave", {});
        release();
      } catch {
        /* ignore */
      }
      releaseSocketRef.current = null;
      socketRef.current = null;
    };
  }, [accessToken, scopingKey, scrollToBottom, isGlobal, nurseCommunityId]);

  useEffect(() => {
    const s = socketRef.current;
    if (s?.connected) {
      requestJoinRoom(s);
    }
  }, [scopingKey]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !socketRef.current?.connected) return;

    setSending(true);
    const body = draft.trim();
    socketRef.current.emit(
      "chat:send",
      { body },
      (ack: SendAck) => {
        setSending(false);
        if (ack.ok) {
          setDraft("");
          setSendError(null);
        } else {
          setSendError(ack.error);
        }
      },
    );
  }

  async function submitReport() {
    if (!reportTargetId) return;
    setReportSubmitting(true);
    try {
      await reportCommunityMember(accessToken, {
        reportedUserId: reportTargetId,
        reason: reportReason,
      });
      setReportDoneNotice("Report processed.");
      setReportTargetId(null);
      setReportReason("");
      setTimeout(() => setReportDoneNotice(null), 3000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setReportSubmitting(false);
    }
  }

  if (loadingHistory) {
    return (
      <div className="flex h-[70vh] items-center justify-center bg-white rounded-3xl border border-neutral-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-50 border-t-red-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            Syncing Messages
          </p>
        </div>
      </div>
    );
  }

  if (historyError) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-red-100 px-6 text-center sm:px-10">
        <p className="text-sm font-bold text-red-800">Could not load messages</p>
        <p className="max-w-md text-xs leading-relaxed text-neutral-600">{historyError}</p>
        <button
          type="button"
          onClick={() => setHistoryRetryKey((k) => k + 1)}
          className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="relative flex flex-col w-full bg-white rounded-[2rem] shadow-2xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden h-[70vh] sm:h-[75vh]">
      <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/80 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          {settingsHref ? (
            <Link
              href={settingsHref}
              className="block truncate text-sm font-black text-neutral-900 hover:text-red-600 uppercase tracking-tight"
            >
              {communityName}
            </Link>
          ) : (
            <span className="block truncate text-sm font-black text-neutral-900 uppercase tracking-tight">
              {communityName}
            </span>
          )}
          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
            {members.length} member{members.length === 1 ? "" : "s"} · Mention
            with @all or @email
          </p>
        </div>
      </div>

      {reportTargetId && (
        <div className="absolute inset-x-0 top-0 z-50 bg-white/95 p-6 backdrop-blur-md border-b border-red-100">
          <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-3">
            Report Community Message
          </h3>
          <textarea
            className="w-full p-4 text-sm bg-neutral-50 border border-neutral-100 rounded-2xl"
            placeholder="Reason for report..."
            rows={2}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={submitReport}
              disabled={reportSubmitting}
              className="flex-1 bg-red-600 text-white text-[10px] font-black uppercase py-3 rounded-xl"
            >
              {reportSubmitting ? "Sending..." : "Submit Report"}
            </button>
            <button
              type="button"
              onClick={() => setReportTargetId(null)}
              className="px-6 bg-neutral-100 text-[10px] font-black rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[#fafafa]"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
              No messages yet. Say hi!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderUserId === userId;
            const isSenderAdmin =
              m.senderRole === "super_admin" || m.senderRole === "admin";
            let bubbleStyles = "";
            if (isMe) {
              bubbleStyles = "bg-red-600 text-white rounded-3xl rounded-tr-none";
            } else if (isSenderAdmin) {
              bubbleStyles =
                "bg-blue-600 text-white border border-indigo-950 rounded-3xl rounded-tl-none";
            } else {
              bubbleStyles =
                "bg-white border border-neutral-100 text-neutral-800 rounded-3xl rounded-tl-none";
            }
            return (
              <div
                key={m.id}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[70%]`}
                >
                  <div className="flex items-center gap-2 mb-2 px-1">
                    {!isMe && (
                      <span
                        className={`text-[10px] font-black uppercase ${isSenderAdmin ? "text-indigo-600" : "text-neutral-800"}`}
                      >
                        {m.senderEmail.split("@")[0]}{" "}
                        {isSenderAdmin && "• ADMIN"}
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-neutral-400">
                      {formatTime(m.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`group relative px-5 py-4 text-sm font-medium leading-relaxed shadow-sm ${bubbleStyles}`}
                  >
                    {isMe ? (
                      <MessageBodyText
                        text={m.body}
                        variant="onPrimary"
                      />
                    ) : isSenderAdmin ? (
                      <MessageBodyText
                        text={m.body}
                        variant="onAdmin"
                      />
                    ) : (
                      <MessageBodyText text={m.body} />
                    )}

                    {!isMe && canFileReports && !isSenderAdmin && (
                      <button
                        type="button"
                        onClick={() => setReportTargetId(m.senderUserId)}
                        className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-neutral-300 hover:text-red-500"
                        title="Report"
                      >
                        ⚑
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 sm:p-6 bg-white border-t border-neutral-50">
        <form onSubmit={handleSend} className="relative">
          {sendError && (
            <p className="absolute -top-6 left-2 text-[10px] text-red-600 font-bold">
              {sendError}
            </p>
          )}
          {showMentionHint && (
            <div className="absolute bottom-full left-0 mb-2 max-h-32 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 text-xs shadow-lg z-10 w-full max-w-md">
              <p className="text-[10px] font-black text-neutral-400 uppercase mb-1">
                Mentions
              </p>
              <button
                type="button"
                className="block w-full text-left px-2 py-1 rounded font-bold text-red-600 hover:bg-red-50"
                onClick={() => {
                  setDraft(
                    (d) =>
                      `${d}${d.endsWith(" ") || d.length === 0 ? "" : " "}@all `,
                  );
                  setShowMentionHint(false);
                }}
              >
                @all
              </button>
              {members.map((u) => (
                <button
                  key={u.userId}
                  type="button"
                  className="block w-full text-left px-2 py-1 rounded hover:bg-red-50"
                  onClick={() => {
                    setDraft(
                      (d) =>
                        `${d}${d.endsWith(" ") || d.length === 0 ? "" : " "}@${u.email} `,
                    );
                    setShowMentionHint(false);
                  }}
                >
                  {u.email}
                </button>
              ))}
            </div>
          )}
          <div
            className={`flex items-end gap-3 bg-neutral-50 rounded-[1.5rem] border p-2 ${
              wsState === "live"
                ? "border-neutral-100"
                : "border-neutral-50 opacity-50"
            }`}
          >
            <textarea
              id="group-chat-input"
              rows={1}
              value={draft}
              onChange={(e) => {
                const v = e.target.value;
                setDraft(v);
                setShowMentionHint(v.includes("@") && v.lastIndexOf("@") >= 0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Message… Use @all or @nurse@email.com"
              disabled={sending || wsState !== "live"}
              className="w-full bg-transparent border-none focus:ring-0 outline-none text-[14px] font-medium py-3 px-4 resize-none max-h-32"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim() || wsState !== "live"}
              className="flex h-12 w-12 shrink-0 items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-neutral-200 text-white rounded-2xl"
            >
              {sending ? "…" : "➤"}
            </button>
          </div>
        </form>
      </div>

      {reportDoneNotice && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-black px-6 py-3 rounded-full">
          {reportDoneNotice}
        </div>
      )}
    </section>
  );
}
