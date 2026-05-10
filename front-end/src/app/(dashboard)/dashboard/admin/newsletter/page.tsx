"use client";

import React, { useState, type FormEvent } from "react";
import { Loader2, Mail, Send, ShieldCheck, Info } from "lucide-react";
import Swal from "sweetalert2";

import { RichTextEditor } from "@/components/rich-text-editor/rich-text-editor.lazy";
import { useAuth } from "@/contexts/auth-context";
import { BackendRequestError } from "@/lib/api/authed-client";
import { broadcastNewsletter } from "@/lib/api/newsletter-admin-api";
import {
  isRichTextEffectivelyEmpty,
  sanitizeBlogRichHtml,
} from "@/lib/sanitize-job-html";

export default function AdminNewsletterPage() {
  const { accessToken, ready, user } = useAuth();
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [sending, setSending] = useState(false);

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

    // Confirmation before sending
    const confirm = await Swal.fire({
      title: "Confirm Broadcast?",
      text: "This will send an email to every nurse and employer in the database. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Send it!",
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
      });

      Swal.fire({
        icon: "success",
        title: "Broadcast Queued",
        text: `Success! Job ID: ${res.jobId}. Your newsletter is being processed.`,
        confirmButtonColor: "#dc2626",
      });

      setSubject("");
      setBodyHtml("");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Broadcast Failed",
        text: err instanceof BackendRequestError ? err.message : "Could not queue broadcast.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSending(false);
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
      {/* Header Section */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b-4 border-red-600 pb-8">
        <div className="space-y-2">
         
          <h1 className="text-2xl font-black  text-slate-900 sm:text-3xl lg:text-4xl">
            News Latter
          </h1>
          <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 sm:text-base">
            Broadcast high-impact updates to your entire network. Emails are queued and delivered 
            via the secure server mail worker.
          </p>
        </div>
        <div className="hidden lg:block">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <Mail className="text-red-600" size={40} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Form */}
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
                  Email Subject Line
                </label>
                <input
                  id="nl-subject"
                  type="text"
                  value={subject}
                  onChange={(ev) => setSubject(ev.target.value)}
                  maxLength={200}
                  className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-5 py-4 text-lg font-bold text-slate-900 outline-none transition focus:border-red-600 focus:bg-white"
                  placeholder="The latest updates for this month..."
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                  Message Content
                </label>
                <div className="rounded-2xl border-2 border-slate-50 bg-slate-50 p-1 focus-within:border-red-600 focus-within:bg-white transition">
                  <RichTextEditor
                    value={bodyHtml}
                    onChange={setBodyHtml}
                    placeholder="Compose your professional broadcast here..."
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
                    Send Broadcast to All
                  </>
                )}
              </button>
              <p className="mt-4 text-center text-xs font-bold text-slate-400">
                Authorized Personnel Only • Audit Log Active
              </p>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[2rem] bg-red-600 p-8 text-white shadow-xl shadow-red-100">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Info size={24} />
            </div>
            <h3 className="mb-2 text-xl font-black uppercase tracking-tight">Broadcast Protocol</h3>
            <ul className="space-y-4 text-sm font-medium text-red-50">
              <li className="flex gap-3">
                <span className="h-1.5 w-1.5 mt-1.5 shrink-0 rounded-full bg-white" />
                Sends to all nurses and employers in this tenant.
              </li>
              <li className="flex gap-3">
                <span className="h-1.5 w-1.5 mt-1.5 shrink-0 rounded-full bg-white" />
                Supports HTML formatting and hyperlinks.
              </li>
              <li className="flex gap-3">
                <span className="h-1.5 w-1.5 mt-1.5 shrink-0 rounded-full bg-white" />
                Delivery speed depends on your SMTP provider limits.
              </li>
            </ul>
          </div>

          <div className="rounded-[2rem] border-2 border-dashed border-slate-200 p-8">
            <h4 className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Security Note</h4>
            <p className="text-xs leading-relaxed text-slate-500">
              Ensure all content complies with anti-spam regulations (CAN-SPAM). Content is automatically sanitized for security before processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}