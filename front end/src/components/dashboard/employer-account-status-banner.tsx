"use client";

import Link from "next/link";
import { AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { useEmployerDashboardBootstrap } from "@/hooks/use-employer-dashboard-bootstrap";

/**
 * Shows healthcare listing approval state and a link to the public profile.
 */
export function EmployerAccountStatusBanner() {
  const { user, ready } = useAuth();
  const { data, isPending, isError, error } = useEmployerDashboardBootstrap();

  if (!ready || user?.role !== "employer") return null;
  if (isPending) return null;
  if (isError) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error instanceof Error ? error.message : "Could not load your organization profile."}
      </div>
    );
  }

  const company = data?.company;
  if (!company) return null;

  const publicUrl = `/companies/${encodeURIComponent(company.slug)}`;
  const approved = company.approvalStatus === "approved";

  return (
    <div
      className={`mb-6 flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
        approved
          ? "border-emerald-200 bg-emerald-50/80"
          : "border-amber-200 bg-amber-50/90"
      }`}
    >
      <div className="flex items-start gap-3">
        {approved ? (
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        )}
        <div>
          <p className="text-sm font-bold text-slate-900">
            {approved
              ? "Your healthcare listing is live"
              : "Your healthcare listing is pending admin review"}
          </p>
          <p className="text-xs text-slate-600">
            {approved
              ? "Candidates can view your public profile and open roles on the site."
              : "You can edit your organization profile, but job posts stay restricted until an administrator approves your organization."}
          </p>
        </div>
      </div>
      <Link
        href={publicUrl}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-red-600 shadow-sm ring-1 ring-slate-200 transition hover:ring-red-200"
        target="_blank"
        rel="noreferrer"
      >
        View public listing
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
