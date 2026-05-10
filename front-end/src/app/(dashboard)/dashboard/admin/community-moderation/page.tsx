"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { isFullOpsAdmin } from "@/lib/api/auth-api";
import { BackendRequestError } from "@/lib/api/authed-client";
import {
  banNurseFromCommunity,
  listCommunityMemberReports,
  type CommunityMemberReportSummary,
} from "@/lib/api/community-moderation-api";
import { ShieldCheck } from "lucide-react";
export default function CommunityModerationPage() {
  const { accessToken, user } = useAuth();
  const [rows, setRows] = useState<CommunityMemberReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listCommunityMemberReports(accessToken);
      setRows(list);
    } catch (e) {
      setError(
        e instanceof BackendRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load reports.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onBan(reportedUserId: string) {
    if (!accessToken) return;
    const ok = window.confirm(
      "Are you sure? This nurse will be immediately restricted from all community chats and posts.",
    );
    if (!ok) return;
    setBusyId(reportedUserId);
    setError(null);
    try {
      await banNurseFromCommunity(accessToken, reportedUserId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ban request failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (!user || !isFullOpsAdmin(user.role)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-sm font-medium text-slate-600">
        Access denied.
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 border-t-4 border-red-600">
      <div className="px-4 sm:px-8 lg:px-12 py-10 lg:py-14">
        
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-8">
          <div className="max-w-3xl">
           
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ">
              Community Moderation
            </h1>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              Monitor community reports and manage safety. Accounts with 
              <span className="mx-1 font-bold text-red-600 underline decoration-red-200">2+ reports</span> 
              are flagged for review.
            </p>
          </div>
          <button 
            onClick={() => void load()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh List
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-xl shadow-md animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="font-bold">{error}</p>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-xl shadow-red-100/30 border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-400 font-medium">Fetching moderation queue...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-20 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-bold text-xl">No active reports</p>
              <p className="text-gray-400">The community is currently behaving well.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-red-600 text-[11px] font-black uppercase tracking-[0.1em] text-white">
                    <th className="px-8 py-5">Reported User</th>
                    <th className="px-8 py-5">Reporters</th>
                    <th className="px-8 py-5">Most Recent Incident</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.reportedUserId} className="hover:bg-red-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-bold text-gray-900 text-base">{r.reportedEmail}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-tighter">ID: {r.reportedUserId}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${
                          r.reporterCount >= 2 
                          ? 'bg-red-100 text-red-700 ring-1 ring-red-200' 
                          : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                        }`}>
                          {r.reporterCount} {r.reporterCount === 1 ? 'Report' : 'Reports'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-gray-600 font-medium">
                        {new Date(r.lastReportedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          type="button"
                          disabled={busyId === r.reportedUserId}
                          onClick={() => void onBan(r.reportedUserId)}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-black text-white hover:bg-red-700 transition-all shadow-md hover:shadow-red-200 disabled:opacity-50 active:scale-95"
                        >
                          {busyId === r.reportedUserId ? (
                            <span className="flex items-center gap-2">
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                              Removing...
                            </span>
                          ) : (
                            "Ban Account"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}