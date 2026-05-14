"use client";

import React, { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  ExternalLink,
  Clock,
  Loader2,
  RotateCcw,
 ShieldCheck ,
              
} from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { isFullOpsAdmin, type AuthUserRole } from "@/lib/api/auth-api";
import { BackendRequestError } from "@/lib/api/authed-client";
import {
  listCompaniesAdminByStatus,
  setCompanyApprovalAdmin,
  type AdminCompanyRow,
  type CompanyApprovalStatus,
} from "@/lib/api/companies-admin-api";
import { blogCoverSrc } from "@/lib/blog-cover-image";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const TABS: { id: CompanyApprovalStatus; label: string; countKey: keyof TabCounts }[] =
  [
    { id: "pending_review", label: "Pending review", countKey: "pending" },
    { id: "approved", label: "Verified", countKey: "approved" },
    { id: "rejected", label: "Rejected", countKey: "rejected" },
  ];

type TabCounts = {
  pending: number;
  approved: number;
  rejected: number;
};

function canAccessCompanyVerifications(role: AuthUserRole | undefined): boolean {
  return role !== undefined && isFullOpsAdmin(role);
}

export default function CompanyVerifications() {
  const { accessToken, ready, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<CompanyApprovalStatus>("pending_review");
  const [companies, setCompanies] = useState<AdminCompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [counts, setCounts] = useState<TabCounts>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const staff = canAccessCompanyVerifications(user?.role);

  const refreshCounts = useCallback(async () => {
    if (!accessToken || !staff) return;
    try {
      const [pending, approved, rejected] = await Promise.all([
        listCompaniesAdminByStatus(accessToken, "pending_review"),
        listCompaniesAdminByStatus(accessToken, "approved"),
        listCompaniesAdminByStatus(accessToken, "rejected"),
      ]);
      setCounts({
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
      });
    } catch {
      /* counts are best-effort; list error still surfaces on tab load */
    }
  }, [accessToken, staff]);

  const loadList = useCallback(async () => {
    if (!accessToken || !staff) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listCompaniesAdminByStatus(accessToken, activeTab);
      setCompanies(list);
    } catch (e) {
      setError(
        e instanceof BackendRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load companies.",
      );
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, staff, activeTab]);

  useEffect(() => {
    if (!ready || !accessToken || !staff) return;
    void loadList();
  }, [ready, accessToken, staff, loadList]);

  useEffect(() => {
    if (!ready || !accessToken || !staff) return;
    void refreshCounts();
  }, [ready, accessToken, staff, refreshCounts]);

  async function applyApproval(id: string, next: CompanyApprovalStatus) {
    if (!accessToken) return;
    setActingId(id);
    setError(null);
    try {
      await setCompanyApprovalAdmin(accessToken, id, next);
      await loadList();
      await refreshCounts();
    } catch (e) {
      setError(
        e instanceof BackendRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Update failed.",
      );
    } finally {
      setActingId(null);
    }
  }

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!ready || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="box-border min-h-screen w-full bg-[#FDFDFD] p-6 text-slate-900">
        <h1 className="text-2xl font-black">Company verifications</h1>
        <p className="mt-2 text-slate-600">
          Only administrators can review employer companies.
        </p>
      </div>
    );
  }

  const emptyCopy: Record<CompanyApprovalStatus, { title: string; body: string }> = {
    pending_review: {
      title: "No pending companies",
      body: "New employer registrations awaiting review will show here.",
    },
    approved: {
      title: "No verified companies",
      body: "Approved companies appear here. You can reject or send them back for review.",
    },
    rejected: {
      title: "No rejected companies",
      body: "Rejected profiles appear here. You can approve them or reopen review.",
    },
  };

  return (
    <div className="box-border min-h-screen w-full bg-[#FDFDFD] p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
        
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Company verifications
          </h1>
          <p className="mt-2 text-lg font-medium text-slate-500">
            Review pending employer profiles, browse verified and rejected
            companies, and update approval status anytime.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatMiniCard
            label="Pending"
            value={counts.pending}
            color="text-amber-500"
            icon={<Clock size={16} />}
          />
          <StatMiniCard
            label="Verified"
            value={counts.approved}
            color="text-emerald-600"
            icon={<CheckCircle2 size={16} />}
          />
          <StatMiniCard
            label="Rejected"
            value={counts.rejected}
            color="text-rose-600"
            icon={<XCircle size={16} />}
          />
        </div>
      </div>

      {error ? (
        <p
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div
        className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-white p-2"
        role="tablist"
        aria-label="Filter by approval status"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const n = counts[tab.countKey];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                active
                  ? "bg-red-600 text-white shadow-md shadow-red-100"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 rounded-md px-1.5 py-0.5 text-xs font-black ${
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-[32px] border border-slate-100 bg-white p-4 lg:flex-row">
        <div className="relative w-full lg:w-96">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="search"
            placeholder="Search by company name…"
            className="w-full rounded-2xl border-none bg-slate-50 py-3.5 pl-12 pr-4 font-medium outline-none transition-all focus:ring-2 focus:ring-red-600/10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map((company) => {
              const logo = blogCoverSrc(company.logoUrl);
              return (
              <div
                key={company.id}
                className="group flex flex-col items-center gap-6 rounded-[28px] border border-slate-100 bg-white p-6 transition-all hover:border-red-100 md:flex-row"
              >
                <div className="flex flex-1 items-center gap-5">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo}
                      alt=""
                      className="h-16 w-16 rounded-2xl border border-slate-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-400 transition-colors group-hover:bg-red-50 group-hover:text-red-600">
                      {initials(company.name)}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">
                        {company.name}
                      </h3>
                      <StatusBadge status={company.approvalStatus} />
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {company.contactEmail ?? "No contact email"} ·{" "}
                      {company.slug}
                    </p>
                  </div>
                </div>

                <div className="hidden text-sm xl:block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Submitted
                  </span>
                  <span className="font-bold">
                    {formatDate(company.createdAt)}
                  </span>
                </div>

                <CompanyStatusActions
                  status={company.approvalStatus}
                  busy={actingId === company.id}
                  onSetStatus={(next) => void applyApproval(company.id, next)}
                />

                <div className="mx-2 hidden h-8 w-px bg-slate-100 sm:block" />
                <Link
                  href={`/companies/${company.slug}`}
                  className="rounded-xl bg-slate-50 p-3 text-slate-600 transition-all hover:bg-slate-100"
                  aria-label="View public company page"
                >
                  <ExternalLink size={18} />
                </Link>
              </div>
            );
            })
          ) : (
            <div className="rounded-[40px] border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
              <Building2 size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-bold text-slate-900">
                {emptyCopy[activeTab].title}
              </h3>
              <p className="text-slate-500">{emptyCopy[activeTab].body}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompanyStatusActions({
  status,
  busy,
  onSetStatus,
}: {
  status: CompanyApprovalStatus;
  busy: boolean;
  onSetStatus: (next: CompanyApprovalStatus) => void;
}) {
  return (
    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
      {status === "pending_review" ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSetStatus("rejected")}
            className="flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-slate-500 transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            <XCircle size={18} /> Reject
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSetStatus("approved")}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            Approve
          </button>
        </>
      ) : null}

      {status === "approved" ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSetStatus("pending_review")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            <RotateCcw size={18} />
            Back to review
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSetStatus("rejected")}
            className="flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-slate-500 transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            <XCircle size={18} /> Reject
          </button>
        </>
      ) : null}

      {status === "rejected" ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSetStatus("pending_review")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            <RotateCcw size={18} />
            Back to review
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSetStatus("approved")}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            Approve
          </button>
        </>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: CompanyApprovalStatus }) {
  const styles: Record<CompanyApprovalStatus, string> = {
    pending_review: "bg-amber-50 text-amber-600 border-amber-100",
    approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rejected: "bg-rose-50 text-rose-600 border-rose-100",
  };

  const label: Record<CompanyApprovalStatus, string> = {
    pending_review: "Pending",
    approved: "Verified",
    rejected: "Rejected",
  };

  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${styles[status]}`}
    >
      {label[status]}
    </span>
  );
}

function StatMiniCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-3">
      <div className={`${color} rounded-lg bg-opacity-10 p-2`}>{icon}</div>
      <div>
        <p className="mb-1 text-[10px] font-black uppercase leading-none tracking-tighter text-slate-400">
          {label}
        </p>
        <p className={`text-xl font-black leading-none ${color}`}>{value}</p>
      </div>
    </div>
  );
}
