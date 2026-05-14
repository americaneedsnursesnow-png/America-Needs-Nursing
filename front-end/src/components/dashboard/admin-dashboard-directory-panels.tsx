"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/contexts/auth-context";
import { BackendRequestError } from "@/lib/api/authed-client";
import { isFullOpsAdmin } from "@/lib/api/auth-api";
import { getApiBaseUrl } from "@/lib/api/env";
import {
  listCompaniesForAdmin,
  listNursesForAdmin,
  type AdminCompanyDirectoryRow,
  type AdminNurseDirectoryRow,
  type Paginated,
  type PaginatedMeta,
} from "@/lib/api/admin-user-directory-api";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

function absoluteFileUrl(relativeOrAbsolute: string | null | undefined): string {
  if (!relativeOrAbsolute) return "";
  if (relativeOrAbsolute.startsWith("http://") || relativeOrAbsolute.startsWith("https://")) {
    return relativeOrAbsolute;
  }
  const base = getApiBaseUrl().replace(/\/$/, "");
  const path = relativeOrAbsolute.startsWith("/")
    ? relativeOrAbsolute
    : `/${relativeOrAbsolute}`;
  return `${base}${path}`;
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function PaginationBar(props: {
  meta: PaginatedMeta | null;
  page: number;
  onPageChange: (p: number) => void;
  disabled: boolean;
}) {
  const { meta, page, onPageChange, disabled } = props;
  if (!meta) return null;
  return (
    <div className="mt-4 flex flex-col items-stretch justify-between gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
      <p className="text-xs text-slate-500">
        Page <span className="font-semibold text-slate-800">{page}</span> of{" "}
        <span className="font-semibold text-slate-800">{meta.totalPages}</span>
        <span className="text-slate-400"> ({meta.totalItems} total)</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || !meta.hasPreviousPage}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-initial"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <button
          type="button"
          disabled={disabled || !meta.hasNextPage}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-initial"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function DashboardAdminNursesPanel() {
  const { accessToken, ready, user } = useAuth();
  const staff = Boolean(user && isFullOpsAdmin(user.role));
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [data, setData] = useState<Paginated<AdminNurseDirectoryRow> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !staff) return;
    setLoading(true);
    setError(null);
    try {
      const r = await listNursesForAdmin(accessToken, page, limit);
      setData(r);
    } catch (e) {
      setData(null);
      setError(e instanceof BackendRequestError ? e.message : "Could not load nurses.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, staff, page, limit]);

  useEffect(() => {
    if (!ready || !staff) return;
    void load();
  }, [ready, staff, load]);

  if (!ready || !user) return null;
  if (!staff) return null;

  const items = data?.items ?? [];

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
            <Stethoscope className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Nurses</h2>
            <p className="text-[11px] text-slate-500">Nurse-role accounts for this site</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <span className="whitespace-nowrap">Rows / page</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number]);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none ring-red-500/30 focus:ring-2"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <Link
            href="/dashboard/admin/user-directory"
            className="text-xs font-semibold text-red-600 hover:text-red-700"
          >
            Full directory →
          </Link>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" aria-hidden />
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No nurse profiles found.</p>
      ) : (
        <div className="max-h-[min(50vh,400px)] min-h-0 flex-1 overflow-x-auto overflow-y-auto [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="sticky top-0 z-[1] bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-2">Email / name</th>
                <th className="px-2 py-2">Specialization</th>
                <th className="px-2 py-2">Resume</th>
                <th className="px-2 py-2">Community</th>
                <th className="px-2 py-2">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {items.map((row) => (
                <tr key={row.userId} className="hover:bg-slate-50/80">
                  <td className="px-2 py-2">
                    <div className="max-w-[180px] truncate font-medium" title={row.user?.email}>
                      {row.user?.email ?? "—"}
                    </div>
                    <div className="max-w-[180px] truncate text-[10px] text-slate-500" title={row.user?.fullName ?? ""}>
                      {row.user?.fullName?.trim() || "—"}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-[11px]">{row.specialization || "—"}</td>
                  <td className="px-2 py-2">
                    {row.resumeUrl ? (
                      <a
                        href={absoluteFileUrl(row.resumeUrl)}
                        className="font-semibold text-red-600 underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        PDF
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-2 py-2 text-[11px]">
                    {row.communityBannedAt ? (
                      <span className="text-amber-700">Banned</span>
                    ) : (
                      "OK"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-[11px] text-slate-500">
                    {formatShortDate(row.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationBar
        meta={data?.meta ?? null}
        page={page}
        onPageChange={setPage}
        disabled={loading}
      />
    </section>
  );
}

export function DashboardAdminCompaniesPanel() {
  const { accessToken, ready, user } = useAuth();
  const staff = Boolean(user && isFullOpsAdmin(user.role));
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [data, setData] = useState<Paginated<AdminCompanyDirectoryRow> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !staff) return;
    setLoading(true);
    setError(null);
    try {
      const r = await listCompaniesForAdmin(accessToken, page, limit);
      setData(r);
    } catch (e) {
      setData(null);
      setError(e instanceof BackendRequestError ? e.message : "Could not load companies.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, staff, page, limit]);

  useEffect(() => {
    if (!ready || !staff) return;
    void load();
  }, [ready, staff, load]);

  if (!ready || !user) return null;
  if (!staff) return null;

  const items = data?.items ?? [];

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
            <Building2 className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Companies</h2>
            <p className="text-[11px] text-slate-500">Registered company profiles on this site</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <span className="whitespace-nowrap">Rows / page</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number]);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none ring-red-500/30 focus:ring-2"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <Link
            href="/dashboard/admin/user-directory"
            className="text-xs font-semibold text-red-600 hover:text-red-700"
          >
            Full directory →
          </Link>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" aria-hidden />
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No companies found.</p>
      ) : (
        <div className="max-h-[min(50vh,400px)] min-h-0 flex-1 overflow-x-auto overflow-y-auto [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="sticky top-0 z-[1] bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-2">Company</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Contact</th>
                <th className="px-2 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="px-2 py-2">
                    <div className="max-w-[160px] truncate font-medium" title={c.name}>
                      {c.name}
                    </div>
                  </td>
                  <td className="px-2 py-2 font-mono text-[10px] text-slate-600">{c.slug}</td>
                  <td className="px-2 py-2 text-[10px] font-semibold uppercase text-slate-600">
                    {c.approvalStatus?.replace(/_/g, " ")}
                  </td>
                  <td className="px-2 py-2">
                    <div className="max-w-[160px] truncate text-[11px]" title={c.employer?.email}>
                      {c.employer?.email ?? "—"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-[11px] text-slate-500">
                    {formatShortDate(c.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationBar
        meta={data?.meta ?? null}
        page={page}
        onPageChange={setPage}
        disabled={loading}
      />
    </section>
  );
}
