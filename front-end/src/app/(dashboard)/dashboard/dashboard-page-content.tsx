"use client";

import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Building2,
  FileSpreadsheet,
  Heart,
  Eye,
  Layers,
  Loader2,
  Users,
} from "lucide-react";
import Link from "next/link";

import {
  DashboardAdminCompaniesPanel,
  DashboardAdminNursesPanel,
} from "@/components/dashboard/admin-dashboard-directory-panels";
import { DashboardPendingCompaniesCard } from "@/components/dashboard/dashboard-pending-companies-card";
import { EmployerAccountStatusBanner } from "@/components/dashboard/employer-account-status-banner";
import { PendingNewslettersDashboardCard } from "@/components/dashboard/pending-newsletters-dashboard-card";
import { useAuth } from "@/contexts/auth-context";
import {
  getAdminDashboardStats,
  type AdminDashboardStats,
  getUserDashboardStats,
  type UserDashboardStats,
} from "@/lib/api/account-api";
import { canAccessAdminShell, isFullOpsAdmin } from "@/lib/api/auth-api";

export function DashboardPageContent() {
  const { accessToken, ready, user } = useAuth();
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null);
  const [adminStatsLoading, setAdminStatsLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserDashboardStats | null>(null);
  const [userStatsLoading, setUserStatsLoading] = useState(false);

  const showAdminStats = Boolean(user && canAccessAdminShell(user.role));
  const showOpsAdminDashboard = Boolean(user && isFullOpsAdmin(user.role));

  useEffect(() => {
    if (!ready || !accessToken || !user) {
      setAdminStats(null);
      setAdminStatsLoading(false);
      setUserStats(null);
      setUserStatsLoading(false);
      return;
    }
    let cancelled = false;
    
    if (canAccessAdminShell(user.role)) {
      setAdminStatsLoading(true);
      getAdminDashboardStats(accessToken)
        .then((data) => {
          if (!cancelled) setAdminStats(data);
        })
        .catch(() => {
          if (!cancelled) setAdminStats(null);
        })
        .finally(() => {
          if (!cancelled) setAdminStatsLoading(false);
        });
    } else {
      setUserStatsLoading(true);
      getUserDashboardStats(accessToken)
        .then((data) => {
          if (!cancelled) setUserStats(data);
        })
        .catch(() => {
          if (!cancelled) setUserStats(null);
        })
        .finally(() => {
          if (!cancelled) setUserStatsLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [ready, accessToken, user]);

  return (
    <div className="box-border w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <EmployerAccountStatusBanner />
      {showAdminStats ? (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
          {(
            [
              {
                label: "Nurses",
                valueKey: "nurseTotal" as const,
                icon: Users,
                color: "bg-sky-50 text-sky-600",
              },
              {
                label: "Companies",
                valueKey: "companyTotal" as const,
                icon: Building2,
                color: "bg-emerald-50 text-emerald-700",
              },
              {
                label: "Listed jobs",
                valueKey: "listedJobsTotal" as const,
                icon: Briefcase,
                color: "bg-amber-50 text-amber-700",
              },
            ] as const
          ).map((stat) => (
            <div
              key={stat.valueKey}
              className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className={`rounded-xl p-3 ${stat.color}`}>
                <stat.icon size={22} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
                <div className="mt-1 flex min-h-[2rem] items-center">
                  {adminStatsLoading ? (
                    <Loader2 className="h-7 w-7 animate-spin text-red-600" aria-hidden />
                  ) : (
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                      {(adminStats?.[stat.valueKey] ?? 0).toLocaleString()}
                    </h3>
                  )}
                </div>
                {stat.valueKey === "listedJobsTotal" ? (
                  <p className="mt-2 text-xs leading-snug text-slate-500">
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
          {[
            { label: "Saved jobs", count: userStats?.savedJobs.toLocaleString() ?? "0", icon: Heart, color: "bg-red-50 text-red-600" },
            { label: "Job views", count: userStats?.jobViews.toLocaleString() ?? "0", icon: Eye, color: "bg-amber-50 text-amber-700" },
            { label: "Total jobs", count: userStats?.totalJobs.toLocaleString() ?? "0", icon: Layers, color: "bg-emerald-50 text-emerald-700" },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className={`rounded-xl p-3 ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
                {userStatsLoading ? (
                  <Loader2 className="h-7 w-7 animate-spin text-red-600" aria-hidden />
                ) : (
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">{stat.count}</h3>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showOpsAdminDashboard ? (
        <>
          <DashboardPendingCompaniesCard />
          <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DashboardAdminNursesPanel />
            <DashboardAdminCompaniesPanel />
          </div>
          <div className="mb-8">
            <Link
              href="/dashboard/admin/nurse-csv-import"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <FileSpreadsheet size={18} aria-hidden />
              Import nurses (CSV)
            </Link>
          </div>
        </>
      ) : null}

      <PendingNewslettersDashboardCard />
    </div>
  );
}
