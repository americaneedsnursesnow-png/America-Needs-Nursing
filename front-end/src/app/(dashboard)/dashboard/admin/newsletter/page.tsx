"use client";

import React, { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, CalendarClock, ChevronLeft, ChevronRight, Loader2, Mail, Send, Info, Pencil } from "lucide-react";
import Swal from "sweetalert2";

import { RichTextEditor } from "@/components/rich-text-editor/rich-text-editor.lazy";
import { useAuth } from "@/contexts/auth-context";
import { BackendRequestError } from "@/lib/api/authed-client";
import {
  broadcastNewsletter,
  getNewsletterMailStatus,
  listNewsletterBroadcasts,
  rescheduleNewsletterBroadcast,
  type NewsletterBroadcastListItem,
  type NewsletterBroadcastsMeta,
  type NewsletterBroadcastStatus,
} from "@/lib/api/newsletter-admin-api";
import {
  isRichTextEffectivelyEmpty,
  sanitizeBlogRichHtml,
} from "@/lib/sanitize-job-html";

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusBadgeClass(status: NewsletterBroadcastStatus): string {
  if (status === "sent") return "bg-emerald-100 text-emerald-800 ring-emerald-600/20";
  if (status === "failed") return "bg-rose-100 text-rose-800 ring-rose-600/20";
  return "bg-amber-100 text-amber-900 ring-amber-600/20";
}

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

export default function AdminNewsletterPage() {
  const { accessToken, ready, user } = useAuth();
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [scheduleLocal, setScheduleLocal] = useState(() => toDatetimeLocalValue(new Date()));
  const [sending, setSending] = useState(false);
  const [rows, setRows] = useState<NewsletterBroadcastListItem[]>([]);
  const [listMeta, setListMeta] = useState<NewsletterBroadcastsMeta | null>(null);
  const [listPage, setListPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [listLoading, setListLoading] = useState(true);
  const [rescheduleDraft, setRescheduleDraft] = useState<Record<string, string>>({});
  const [rescheduleSavingId, setRescheduleSavingId] = useState<string | null>(null);
  const [outboundMailConfigured, setOutboundMailConfigured] = useState<boolean | null>(null);

  const fetchMailStatus = useCallback(async () => {
    if (!accessToken) return;
    try {
      const status = await getNewsletterMailStatus(accessToken);
      setOutboundMailConfigured(status.outboundEmailConfigured);
    } catch {
      setOutboundMailConfigured(null);
    }
  }, [accessToken]);

  const fetchBroadcastsPage = useCallback(
    async (page: number, limit: number) => {
      if (!accessToken) return;
      setListLoading(true);
      try {
        const data = await listNewsletterBroadcasts(accessToken, { page, limit });
        setRows(data.items);
        setListMeta(data.meta);
        setListPage(data.meta.page);
      } catch {
        setRows([]);
        setListMeta(null);
      } finally {
        setListLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    if (!ready || !accessToken) return;
    void fetchMailStatus();
  }, [ready, accessToken, fetchMailStatus]);

  useEffect(() => {
    if (!ready || !accessToken) return;
    void fetchBroadcastsPage(listPage, pageSize);
  }, [ready, accessToken, listPage, pageSize, fetchBroadcastsPage]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!accessToken) {
      Swal.fire({
        icon: "error",
        title: "Session Expired",
        text: "Please sign in again to send broadcasts.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    const trimmedSubject = subject.trim();
    if (!trimmedSubject) {
      Swal.fire({
        icon: "warning",
        title: "Missing Subject",
        text: "Please enter a subject line for your email.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    if (isRichTextEffectivelyEmpty(bodyHtml)) {
      Swal.fire({
        icon: "warning",
        title: "Empty Content",
        text: "You cannot send an empty newsletter.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    const sendAt = new Date(scheduleLocal);
    if (Number.isNaN(sendAt.getTime())) {
      Swal.fire({
        icon: "warning",
        title: "Invalid schedule",
        text: "Pick a valid date and time for the send.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Queue this newsletter?",
      html: `<p class="text-left text-sm text-slate-600">Recipients: all nurses and employers for this tenant. Sends at <strong>${sendAt.toLocaleString()}</strong> (your local time) unless you reschedule while it is still pending.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Queue send",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    const html = sanitizeBlogRichHtml(bodyHtml);
    setSending(true);

    try {
      const res = await broadcastNewsletter(accessToken, {
        subject: trimmedSubject,
        html,
        scheduledAt: sendAt.toISOString(),
      });

      setListPage(1);
      await fetchBroadcastsPage(1, pageSize);
      await fetchMailStatus();

      Swal.fire({
        icon: "success",
        title: "Newsletter queued",
        text: `Status: ${res.status}. Scheduled: ${formatWhen(res.scheduledAt)}.`,
        confirmButtonColor: "#dc2626",
      });

      setSubject("");
      setBodyHtml("");
      setScheduleLocal(toDatetimeLocalValue(new Date()));
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Queue failed",
        text: err instanceof BackendRequestError ? err.message : "Could not queue newsletter.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSending(false);
    }
  }

  async function saveReschedule(id: string) {
    if (!accessToken) return;
    const raw = rescheduleDraft[id];
    if (!raw) return;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      Swal.fire({
        icon: "warning",
        title: "Invalid time",
        text: "Choose a valid date and time.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }
    setRescheduleSavingId(id);
    try {
      await rescheduleNewsletterBroadcast(accessToken, id, d.toISOString());
      const next = { ...rescheduleDraft };
      delete next[id];
      setRescheduleDraft(next);
      await fetchBroadcastsPage(listPage, pageSize);
      Swal.fire({
        icon: "success",
        title: "Send time updated",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Could not reschedule",
        text: err instanceof BackendRequestError ? err.message : "Update failed.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setRescheduleSavingId(null);
    }
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="w-full px-8 py-8 md:py-10 lg:py-12 animate-in fade-in duration-700">
      <div className="mb-10 flex flex-col gap-6 border-b-4 border-red-600 pb-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl lg:text-4xl">Newsletter</h1>
          <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 sm:text-base">
            Schedule broadcasts to nurses and employers. Pending sends can be moved to a new time; sent and failed rows
            are read-only.
          </p>
        </div>
        <div className="hidden lg:block">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <Mail className="text-red-600" size={40} />
          </div>
        </div>
      </div>

      {outboundMailConfigured === false && (
        <div
          className="mb-10 flex gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-sm"
          role="alert"
        >
          <div className="shrink-0 pt-0.5">
            <AlertTriangle className="h-7 w-7 text-amber-600" aria-hidden />
          </div>
          <div className="min-w-0 space-y-2">
            <h2 className="text-base font-black tracking-tight text-amber-950">
              Outbound email is not configured
            </h2>
            <p className="text-sm leading-relaxed text-amber-900/90">
              The API server does not have working SMTP or SES settings, so queued newsletters will fail when they run.
              Password-reset and other system emails will not send either until this is fixed.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900/85">
              <li>
                <strong>SMTP (default):</strong> set <code className="rounded bg-amber-100/80 px-1">SMTP_HOST</code> on
                the backend; optionally <code className="rounded bg-amber-100/80 px-1">SMTP_USER</code>,{" "}
                <code className="rounded bg-amber-100/80 px-1">SMTP_PASS</code>,{" "}
                <code className="rounded bg-amber-100/80 px-1">MAIL_FROM</code>.
              </li>
              <li>
                <strong>AWS SES:</strong> set <code className="rounded bg-amber-100/80 px-1">MAIL_PROVIDER=ses</code>,{" "}
                <code className="rounded bg-amber-100/80 px-1">AWS_SES_REGION</code>, and a verified{" "}
                <code className="rounded bg-amber-100/80 px-1">MAIL_FROM</code> (and IAM credentials if not using the
                task role).
              </li>
            </ul>
            <p className="text-xs font-medium text-amber-800/80">
              See <code className="rounded bg-amber-100/80 px-1">ann-backend/.env.example</code>, restart the API after
              changing environment variables.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <form
            onSubmit={onSubmit}
            className="space-y-8 rounded-[2rem] border-2 border-slate-100 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="nl-subject"
                  className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400"
                >
                  Email subject line
                </label>
                <input
                  id="nl-subject"
                  type="text"
                  value={subject}
                  onChange={(ev) => setSubject(ev.target.value)}
                  maxLength={200}
                  className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-5 py-4 text-lg font-bold text-slate-900 outline-none transition focus:border-red-600 focus:bg-white"
                  placeholder="The latest updates for this month…"
                  autoComplete="off"
                />
              </div>

              <div>
                <label
                  htmlFor="nl-schedule"
                  className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400"
                >
                  <CalendarClock size={14} className="text-red-500" aria-hidden />
                  Send time
                </label>
                <input
                  id="nl-schedule"
                  type="datetime-local"
                  value={scheduleLocal}
                  onChange={(ev) => setScheduleLocal(ev.target.value)}
                  className="w-full max-w-md rounded-2xl border-2 border-slate-50 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-red-600 focus:bg-white"
                />
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Time is interpreted in your browser&apos;s local timezone and stored in UTC on the server.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                  Message content
                </label>
                <div className="rounded-2xl border-2 border-slate-50 bg-slate-50 p-1 transition focus-within:border-red-600 focus-within:bg-white">
                  <RichTextEditor
                    value={bodyHtml}
                    onChange={setBodyHtml}
                    placeholder="Compose your professional broadcast here…"
                    contentMinClass="min-h-[400px]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={sending}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-red-600 py-5 text-lg font-black uppercase tracking-widest text-white shadow-xl shadow-red-100 transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <Send size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    Queue newsletter
                  </>
                )}
              </button>
              <p className="mt-4 text-center text-xs font-bold text-slate-400">
                Authorized personnel only • HTML is sanitized before storage
              </p>
            </div>
          </form>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-[2rem] bg-red-600 p-8 text-white shadow-xl shadow-red-100">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Info size={24} />
            </div>
            <h3 className="mb-2 text-xl font-black uppercase tracking-tight">How scheduling works</h3>
            <ul className="space-y-4 text-sm font-medium text-red-50">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                Each queue entry is saved with subject, body, and send time.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                Pending rows can be rescheduled; sent and failed rows cannot.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                Delivery still depends on your mail provider limits and worker availability.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <section
        className="mt-10 overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-sm"
        aria-labelledby="nl-history-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
          <h2 id="nl-history-heading" className="text-sm font-black uppercase tracking-widest text-slate-500">
            Your newsletters
          </h2>
          {listLoading ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-red-600" aria-hidden />
          ) : (
            <span className="text-xs font-bold text-slate-400">
              {listMeta ? `${listMeta.totalItems.toLocaleString()} total` : "—"}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-white text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3 text-right">Recipients</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-600" aria-hidden />
                    <p className="mt-2 text-sm text-slate-500">Loading…</p>
                  </td>
                </tr>
              ) : !listLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    {listMeta && listMeta.totalItems === 0
                      ? "No newsletters yet. Compose one above to queue your first send."
                      : "No newsletters on this page. Use Prev or Next to browse."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="bg-white hover:bg-slate-50/60">
                    <td className="max-w-[220px] px-4 py-3">
                      <div className="truncate font-semibold text-slate-900">{r.subject}</div>
                      {r.status === "failed" && r.failureReason ? (
                        <p className="mt-1 line-clamp-2 text-[11px] text-rose-600" title={r.failureReason}>
                          {r.failureReason}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wide ring-1 ring-inset ${statusBadgeClass(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatWhen(r.scheduledAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {r.sentAt ? formatWhen(r.sentAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {r.recipientCount === null || r.recipientCount === undefined ? "—" : r.recipientCount}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "pending" ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="datetime-local"
                            aria-label={`Reschedule ${r.subject}`}
                            value={rescheduleDraft[r.id] ?? toDatetimeLocalValue(new Date(r.scheduledAt))}
                            onChange={(ev) =>
                              setRescheduleDraft((prev) => ({ ...prev, [r.id]: ev.target.value }))
                            }
                            className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-red-500"
                          />
                          <button
                            type="button"
                            disabled={rescheduleSavingId === r.id}
                            onClick={() => void saveReschedule(r.id)}
                            className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:opacity-50"
                          >
                            {rescheduleSavingId === r.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Pencil size={14} aria-hidden />
                            )}
                            Save
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-600">
            {listMeta
              ? `Page ${listMeta.page} of ${listMeta.totalPages} · ${listMeta.totalItems.toLocaleString()} total`
              : "—"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="nl-page-size" className="text-xs font-black uppercase tracking-widest text-slate-400">
              Per page
            </label>
            <select
              id="nl-page-size"
              value={pageSize}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPageSize([10, 25, 50].includes(v) ? v : 10);
                setListPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-red-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={listLoading || !listMeta || listMeta.page <= 1}
                onClick={() => setListPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-800 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={18} aria-hidden />
                Prev
              </button>
              <button
                type="button"
                disabled={listLoading || !listMeta || listMeta.page >= listMeta.totalPages}
                onClick={() => setListPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-800 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Next
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
