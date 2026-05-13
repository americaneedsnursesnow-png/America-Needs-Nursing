"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Download, LayoutList, Loader2, Stethoscope } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { BackendRequestError } from "@/lib/api/authed-client";
import { isFullOpsAdmin, type AuthUserRole } from "@/lib/api/auth-api";
import { getApiBaseUrl } from "@/lib/api/env";
import {
  fetchAllCompaniesForAdminExport,
  fetchAllNursesForAdminExport,
  listCompaniesForAdmin,
  listNursesForAdmin,
  type AdminCompanyDirectoryRow,
  type AdminNurseDirectoryRow,
  type Paginated,
  type PaginatedMeta,
} from "@/lib/api/admin-user-directory-api";
import {
  downloadTextFile,
  makeExportFilename,
  toCsvString,
} from "@/lib/csv-export";

type Tab = "nurses" | "companies";

function canUseDirectory(role: AuthUserRole | undefined): boolean {
  return role !== undefined && isFullOpsAdmin(role);
}

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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

/** For CSV: rough plain text from rich HTML (no full sanitizer; export only). */
function stripHtmlToPlain(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function PaginationBar(props: {
  meta: PaginatedMeta | null;
  onPageChange: (p: number) => void;
  disabled: boolean;
}) {
  const { meta, onPageChange, disabled } = props;
  if (!meta) return null;
  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
      <p className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-800">{meta.page}</span> of{" "}
        <span className="font-semibold text-slate-800">{meta.totalPages}</span>{" "}
        <span className="text-slate-400">({meta.totalItems} total)</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || !meta.hasPreviousPage}
          onClick={() => onPageChange(meta.page - 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          type="button"
          disabled={disabled || !meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function AdminUserDirectoryPage() {
  const { accessToken, ready, user } = useAuth();
  const staff = canUseDirectory(user?.role);
  const [tab, setTab] = useState<Tab>("nurses");
  const [page, setPage] = useState(1);
  const [nurses, setNurses] = useState<Paginated<AdminNurseDirectoryRow> | null>(null);
  const [companies, setCompanies] = useState<Paginated<AdminCompanyDirectoryRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"nurses" | "companies" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const loadNurses = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const r = await listNursesForAdmin(accessToken, page, 100);
      setNurses(r);
    } catch (e) {
      setNurses(null);
      setError(e instanceof BackendRequestError ? e.message : "Could not load nurses.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  const loadCompanies = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const r = await listCompaniesForAdmin(accessToken, page, 100);
      setCompanies(r);
    } catch (e) {
      setCompanies(null);
      setError(
        e instanceof BackendRequestError ? e.message : "Could not load employer companies.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    if (!ready || !accessToken || !staff) {
      if (ready && user && !staff) setLoading(false);
      return;
    }
    if (tab === "nurses") void loadNurses();
    else void loadCompanies();
  }, [ready, accessToken, staff, user, tab, page, loadNurses, loadCompanies]);

  async function handleDownloadNursesCsv() {
    if (!accessToken) return;
    setExporting("nurses");
    setExportError(null);
    try {
      const rows = await fetchAllNursesForAdminExport(accessToken);
      const headers = [
        "userId",
        "clientName",
        "email",
        "fullName",
        "role",
        "specialization",
        "licenseNumber",
        "yearsExperience",
        "resumeUrl",
        "communityVerified",
        "communityBannedAt",
        "profileUpdatedAt",
        "userCreatedAt",
        "profilePhotoUrl",
      ];
      const data = rows.map((r) => [
        r.userId,
        r.clientName,
        r.user?.email ?? "",
        r.user?.fullName ?? "",
        r.user?.role ?? "nurse",
        r.specialization,
        r.licenseNumber,
        r.yearsExperience ?? "",
        r.resumeUrl,
        r.communityVerified,
        r.communityBannedAt ?? "",
        r.updatedAt,
        r.user?.createdAt ?? "",
        r.user?.profilePhotoUrl ?? "",
      ]);
      const csv = toCsvString(headers, data);
      downloadTextFile(
        makeExportFilename("nurses", user?.clientName),
        csv,
      );
    } catch (e) {
      setExportError(
        e instanceof BackendRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not export nurse list.",
      );
    } finally {
      setExporting(null);
    }
  }

  async function handleDownloadEmployersCsv() {
    if (!accessToken) return;
    setExporting("companies");
    setExportError(null);
    try {
      const rows = await fetchAllCompaniesForAdminExport(accessToken);
      const headers = [
        "companyId",
        "clientName",
        "companyName",
        "slug",
        "approvalStatus",
        "contactEmail",
        "contactPhone",
        "descriptionPlain",
        "culturePlain",
        "employerUserId",
        "employerEmail",
        "employerFullName",
        "employerRole",
        "employerUserCreatedAt",
        "companyCreatedAt",
        "companyUpdatedAt",
      ];
      const data = rows.map((c) => [
        c.id,
        c.clientName,
        c.name,
        c.slug,
        c.approvalStatus,
        c.contactEmail ?? "",
        c.contactPhone ?? "",
        stripHtmlToPlain(c.description),
        stripHtmlToPlain(c.cultureText),
        c.employerUserId,
        c.employer?.email ?? "",
        c.employer?.fullName ?? "",
        c.employer?.role ?? "company",
        c.employer?.createdAt ?? "",
        c.createdAt,
        c.updatedAt,
      ]);
      const csv = toCsvString(headers, data);
      downloadTextFile(
        makeExportFilename("employers", user?.clientName),
        csv,
      );
    } catch (e) {
      setExportError(
        e instanceof BackendRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not export employer list.",
      );
    } finally {
      setExporting(null);
    }
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading…</div>
    );
  }

  if (!staff) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        You do not have access to this page.
      </div>
    );
  }

  const currentMeta = tab === "nurses" ? nurses?.meta : companies?.meta;
  const nurseItems = nurses?.items ?? [];
  const companyItems = companies?.items ?? [];

  return (
    <div className="w-full px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3 text-red-600">
          <LayoutList className="h-8 w-8" />
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Nurses & employers
          </h1>
        </div>
        <p className="max-w-2xl text-slate-600">
          All nurse accounts and employer company records for this site (same client as your admin
          account). Data loads <strong>100 per page</strong> from the API. Use Next / Previous to
          browse the full list.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            disabled={!!exporting}
            onClick={() => void handleDownloadNursesCsv()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-red-200 hover:text-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            {exporting === "nurses" ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-red-500" />
            ) : (
              <Download className="h-4 w-4 shrink-0" />
            )}
            Download all nurses (CSV)
          </button>
          <button
            type="button"
            disabled={!!exporting}
            onClick={() => void handleDownloadEmployersCsv()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-red-200 hover:text-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            {exporting === "companies" ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-red-500" />
            ) : (
              <Download className="h-4 w-4 shrink-0" />
            )}
            Download all employers (CSV)
          </button>
        </div>
        {exportError && (
          <p className="mt-2 text-sm text-amber-800" role="alert">
            {exportError}
          </p>
        )}
      </div>

      <div className="mb-6 inline-flex w-full max-w-md rounded-2xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => {
            setTab("nurses");
            setPage(1);
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
            tab === "nurses" ? "bg-white text-red-600 shadow" : "text-slate-500"
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          Nurses
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("companies");
            setPage(1);
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
            tab === "companies" ? "bg-white text-red-600 shadow" : "text-slate-500"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Employers
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex min-h-[200px] items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-red-500" />
        </div>
      )}

      {!loading && tab === "nurses" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {nurseItems.length === 0 ? (
            <p className="p-8 text-center text-slate-500">No nurse profiles found for this site.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Email / name</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Specialization</th>
                  <th className="px-4 py-3">License</th>
                  <th className="px-4 py-3">Exp. (yrs)</th>
                  <th className="px-4 py-3">Resume</th>
                  <th className="px-4 py-3">Community</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nurseItems.map((row) => (
                  <tr key={row.userId} className="text-slate-800 hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.user?.email ?? "—"}</div>
                      <div className="text-xs text-slate-500">{row.user?.fullName?.trim() || "—"}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.userId}</td>
                    <td className="px-4 py-3 text-xs font-semibold uppercase">{row.user?.role}</td>
                    <td className="px-4 py-3">{row.specialization || "—"}</td>
                    <td className="px-4 py-3">{row.licenseNumber || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {row.yearsExperience == null ? "—" : row.yearsExperience}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {row.resumeUrl ? (
                        <a
                          href={absoluteFileUrl(row.resumeUrl)}
                          className="text-red-600 underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          PDF
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {row.communityBannedAt ? (
                        <span className="text-amber-700" title="Banned from community">
                          Banned
                        </span>
                      ) : (
                        "OK"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(row.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          <PaginationBar
            meta={nurses?.meta ?? null}
            onPageChange={setPage}
            disabled={loading}
          />
        </div>
      )}

      {!loading && tab === "companies" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {companyItems.length === 0 ? (
            <p className="p-8 text-center text-slate-500">No companies found for this site.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Contact email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Employer account</th>
                  <th className="px-4 py-3">Employer ID</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companyItems.map((c) => (
                  <tr key={c.id} className="text-slate-800 hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.slug}</td>
                    <td className="px-4 py-3 text-xs font-semibold uppercase text-slate-600">
                      {c.approvalStatus?.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-xs">{c.contactEmail || "—"}</td>
                    <td className="px-4 py-3 text-xs">{c.contactPhone || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-slate-800">
                        {c.employer?.email ?? "—"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.employer?.fullName?.trim() || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {c.employerUserId}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          <PaginationBar
            meta={companies?.meta ?? null}
            onPageChange={setPage}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
}
