"use client";

import React, { useEffect, useState } from "react";
import { Building2, Clock, ExternalLink, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/contexts/auth-context";
import { isFullOpsAdmin } from "@/lib/api/auth-api";
import { BackendRequestError } from "@/lib/api/authed-client";
import {
  listCompaniesAdminByStatus,
  type AdminCompanyRow,
} from "@/lib/api/companies-admin-api";
import { blogCoverSrc } from "@/lib/blog-cover-image";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stripHtmlRough(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatSubmitted(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export function DashboardPendingCompaniesCard() {
  const { accessToken, ready, user } = useAuth();
  const staff = Boolean(user && isFullOpsAdmin(user.role));
  const [companies, setCompanies] = useState<AdminCompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !accessToken || !staff) {
      if (ready && user && !staff) setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listCompaniesAdminByStatus(accessToken, "pending_review")
      .then((list) => {
        if (!cancelled) setCompanies(list);
      })
      .catch((e) => {
        if (!cancelled) {
          setCompanies([]);
          setError(
            e instanceof BackendRequestError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Could not load pending companies.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, accessToken, staff, user]);

  if (!ready || !user) return null;
  if (!staff) return null;

  return (
    <section className="mb-8 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-4 border-b border-amber-100/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-800">
            <Clock className="h-6 w-6 shrink-0" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              Companies pending review
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Employer registrations waiting for approval before they appear publicly.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-200/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-950">
            {loading ? "…" : `${companies.length} pending`}
          </span>
          <Link
            href="/dashboard/admin/company-verified"
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
          >
            Pending Approvals
            <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden />
          </Link>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-14 text-amber-700/80">
          <Loader2 className="h-9 w-9 animate-spin" aria-hidden />
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-200/80 bg-white/60 px-4 py-10 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-amber-300" aria-hidden />
          <p className="font-semibold text-slate-800">No companies awaiting review</p>
          <p className="mt-1 text-sm text-slate-500">
            New employer sign-ups will show here when their status is pending.
          </p>
        </div>
      ) : (
        <ul className="max-h-[min(55vh,520px)] space-y-4 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
          {companies.map((c) => {
            const logo = blogCoverSrc(c.logoUrl);
            const blurb = stripHtmlRough(c.description);
            return (
              <li
                key={c.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-amber-200/80 hover:shadow-md sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex shrink-0 gap-4">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt=""
                        className="h-14 w-14 rounded-xl border border-slate-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-500">
                        {initials(c.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                          Pending review
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-slate-500">/{c.slug}</p>
                      <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                        <div>
                          <dt className="font-semibold uppercase tracking-wide text-slate-400">
                            Contact
                          </dt>
                          <dd className="mt-0.5 break-all font-medium text-slate-800">
                            {c.contactEmail ?? "—"}
                          </dd>
                          {c.contactPhone ? (
                            <dd className="mt-1 text-slate-600">{c.contactPhone}</dd>
                          ) : null}
                        </div>
                        <div>
                          <dt className="font-semibold uppercase tracking-wide text-slate-400">
                            Submitted
                          </dt>
                          <dd className="mt-0.5 font-medium text-slate-800">
                            {formatSubmitted(c.createdAt)}
                          </dd>
                          <dt className="mt-2 font-semibold uppercase tracking-wide text-slate-400">
                            Employer user ID
                          </dt>
                          <dd className="mt-0.5 break-all font-mono text-[11px] text-slate-600">
                            {c.employerUserId}
                          </dd>
                        </div>
                      </dl>
                      {blurb ? (
                        <p className="mt-3 line-clamp-3 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600">
                          {blurb}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end sm:pl-2">
                    <Link
                      href="/dashboard/admin/company-verified"
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 transition hover:border-red-200 hover:bg-white hover:text-red-700"
                    >
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      Review
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
