"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Send, MessageSquare, User, AlertCircle, ArrowLeft, MoreHorizontal } from "lucide-react";

import { NurseJobMessagesPanel } from "@/features/messaging";
import { appendThreadMessageIfNew } from "@/features/messaging/thread-messages-dedupe";
import { useThreadMessagesRealtime } from "@/features/messaging/use-thread-messages-realtime";
import { useAuth } from "@/contexts/auth-context";
import { BackendRequestError } from "@/lib/api/authed-client";
import { listApplicationsForJob } from "@/lib/api/applications-employer-api";
import { listEmployerJobs } from "@/lib/api/jobs-employer-api";
import {
  listMessagingThreads,
  sendThreadMessage,
  type MessagingThread,
  type ThreadMessage,
} from "@/lib/api/messaging-api";
import { isShortlistedApplicationStatus } from "@/lib/employer-applications-ui";

type ThreadRow = {
  applicationId: string;
  lastMessageAt: string | null;
  label: string;
  jobTitle: string;
  nurseName: string;
};

function formatMsgTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function MessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationIdFromUrl = searchParams.get("applicationId");
  const { user, accessToken, ready } = useAuth();
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildEmployerThreadRows = useCallback(
    async (token: string, apiThreads: MessagingThread[]): Promise<ThreadRow[]> => {
      const jobs = await listEmployerJobs(token);
      const lastByApp = new Map(apiThreads.map((t) => [t.applicationId, t.lastMessageAt] as const));
      const rows: ThreadRow[] = [];
      for (const job of jobs) {
        const apps = await listApplicationsForJob(token, job.id);
        for (const a of apps) {
          if (!isShortlistedApplicationStatus(a.status)) continue;
          const nurse = a.nurse?.fullName?.trim() || a.nurse?.email || "Candidate";
          rows.push({
            applicationId: a.id,
            lastMessageAt: lastByApp.get(a.id) ?? null,
            label: `${job.title} · ${nurse}`,
            jobTitle: job.title,
            nurseName: nurse,
          });
        }
      }
      return rows.sort((x, y) => (y.lastMessageAt ? new Date(y.lastMessageAt).getTime() : 0) - (x.lastMessageAt ? new Date(x.lastMessageAt).getTime() : 0));
    }, []);

  const loadThreads = useCallback(async () => {
    if (!accessToken || !user || user.role !== "employer") return;
    setLoadingThreads(true);
    try {
      const raw = await listMessagingThreads(accessToken);
      const rows = await buildEmployerThreadRows(accessToken, raw);
      setThreads(rows);
      if (!activeApplicationId && rows.length > 0) setActiveApplicationId(rows[0].applicationId);
    } catch (e) {
      setError("Sync failed.");
    } finally {
      setLoadingThreads(false);
    }
  }, [accessToken, user, buildEmployerThreadRows, activeApplicationId]);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace("/sign-in?next=/dashboard/employee/messages"); return; }
    if (user.role === "employer") void loadThreads();
  }, [ready, user, router, loadThreads]);

  useEffect(() => {
    if (user?.role !== "employer") return;
    const id = applicationIdFromUrl?.trim();
    if (!id) return;
    setActiveApplicationId(id);
  }, [user?.role, applicationIdFromUrl]);

  useThreadMessagesRealtime(accessToken, user?.role === "employer" ? activeApplicationId : null, user?.role === "employer", setMessages, setLoadingMessages);

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accessToken || !activeApplicationId || !inputValue.trim()) return;
    setSending(true);
    try {
      const msg = await sendThreadMessage(accessToken, activeApplicationId, inputValue.trim());
      setMessages((prev) => appendThreadMessageIfNew(prev, msg));
      setInputValue("");
      void loadThreads();
    } catch (err) {
      const msg =
        err instanceof BackendRequestError
          ? err.message
          : "Message failed.";
      setError(msg);
    } finally {
      setSending(false);
    }
  }

  if (user?.role === "nurse" && accessToken) {
    return <NurseJobMessagesPanel accessToken={accessToken} userId={user.id} variant="page" initialApplicationId={searchParams.get("applicationId")} />;
  }

  const filteredThreads = threads.filter((t) => t.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeThread = threads.find((t) => t.applicationId === activeApplicationId);

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] bg-[#FDFDFD]">
      
      {/* --- TOP BRANDED HEADER --- */}
      <div className="w-full bg-white border-b border-gray-100 py-6 px-8 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
               
            </div>
            <h1 className="text-3xl font-black text-gray-900  uppercase">
              Inbox<span className="text-red-600">.</span>

            </h1>
                                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Communication Center</span>

          </div>
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* --- MAIN INTERFACE --- */}
      <div className="flex flex-1 overflow-hidden border-t border-gray-100 mx-8 mb-8 rounded-3xl bg-white shadow-2xl shadow-gray-200/50">
        
        {/* SIDEBAR */}
        <div className="w-full max-w-[320px] border-r border-gray-50 flex flex-col bg-gray-50/20">
          <div className="p-5">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" />
              <input
                type="search"
                placeholder="SEARCH CANDIDATES"
                className="w-full rounded-xl border-none bg-white p-3 pl-10 text-[10px] font-black tracking-widest shadow-sm outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-red-600/20 transition-all placeholder:text-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-3">
            {loadingThreads ? (
              <div className="py-10 text-center animate-pulse">
                <div className="h-2 w-24 bg-gray-200 mx-auto rounded-full mb-2" />
                <div className="h-2 w-16 bg-gray-100 mx-auto rounded-full" />
              </div>
            ) : (
              filteredThreads.map((t) => (
                <button
                  key={t.applicationId}
                  onClick={() => setActiveApplicationId(t.applicationId)}
                  className={`relative w-full text-left mb-2 p-4 rounded-2xl transition-all ${
                    activeApplicationId === t.applicationId
                      ? "bg-gray-900 shadow-xl shadow-gray-200"
                      : "bg-transparent hover:bg-white hover:shadow-sm"
                  }`}
                >
                  {activeApplicationId === t.applicationId && (
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-red-600 rounded-r-full" />
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${activeApplicationId === t.applicationId ? "text-red-500" : "text-red-600"}`}>
                      {t.nurseName}
                    </span>
                    <span className="text-[8px] font-bold text-gray-400">{t.lastMessageAt && formatMsgTime(t.lastMessageAt)}</span>
                  </div>
                  <h3 className={`text-xs font-black truncate tracking-tight ${activeApplicationId === t.applicationId ? "text-white" : "text-gray-900"}`}>
                    {t.jobTitle}
                  </h3>
                </button>
              ))
            )}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className="flex-1 flex flex-col bg-white">
          {activeThread ? (
            <>
              {/* Chat Header */}
              <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-red-100">
                    {activeThread.nurseName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-900 leading-none">
                      {activeThread.nurseName}
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                      Target: <span className="text-gray-900">{activeThread.jobTitle}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/employee/my-jobs`} className="px-4 py-2 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-tighter text-gray-400 hover:text-red-600 hover:border-red-100 transition-all">
                        Details
                    </Link>
                    <MoreHorizontal className="text-gray-300 h-5 w-5" />
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                {messages.map((m) => {
                  const mine = m.senderUserId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[65%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                        <div className={`px-5 py-3.5 text-sm font-medium leading-relaxed shadow-sm transition-all ${
                          mine 
                            ? "bg-red-600 text-white rounded-3xl rounded-tr-none" 
                            : "bg-gray-100 text-gray-900 rounded-3xl rounded-tl-none"
                        }`}>
                          {m.body}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-300 px-1">
                          {formatMsgTime(m.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {loadingMessages && (
                    <div className="flex justify-center py-4">
                        <div className="h-1 w-12 bg-red-100 rounded-full animate-pulse" />
                    </div>
                )}
              </div>

              {/* Input Bar */}
              <div className="p-6 bg-white border-t border-gray-50">
                <form 
                  onSubmit={(e) => void handleSend(e)}
                  className="flex items-center gap-3 bg-gray-900 rounded-2xl p-2.5 shadow-xl shadow-gray-200"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="WRITE A MESSAGE..."
                    className="flex-1 bg-transparent border-none text-white text-xs font-black tracking-widest px-4 focus:outline-none placeholder:text-gray-600 uppercase"
                  />
                  <button 
                    disabled={sending || !inputValue.trim()}
                    className="h-10 w-10 flex items-center justify-center bg-red-600 text-white rounded-xl hover:bg-red-500 transition-all active:scale-90 disabled:opacity-20"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="h-8 w-8 text-gray-200" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Communication Terminal</h3>
              <p className="text-xs font-bold text-gray-400 mt-2 max-w-[240px] uppercase leading-relaxed tracking-tighter">
                Select a candidate from the directory to start a secure direct transmission.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F1F1F1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #DC2626; }
      `}</style>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageInner />
    </Suspense>
  );
}