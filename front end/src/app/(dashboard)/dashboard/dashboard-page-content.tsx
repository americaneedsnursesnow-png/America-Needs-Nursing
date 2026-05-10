"use client";

import dynamic from "next/dynamic";
import React from "react";
import {
  Briefcase,
  Heart,
  Eye,
  Layers,
  Edit,
  Trash2,
  Users,
} from "lucide-react";

import { EmployerAccountStatusBanner } from "@/components/dashboard/employer-account-status-banner";

const DashboardSaleChart = dynamic(
  () =>
    import("@/components/dashboard/dashboard-sale-chart").then(
      (m) => m.DashboardSaleChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[280px] w-full items-center justify-center rounded-xl bg-slate-50"
        aria-hidden
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
      </div>
    ),
  },
);

type JobRow = {
  role: string;
  company: string;
  applicants: number;
  postDate: string;
  expiryDate: string;
  color?: string;
};

function JobTable({ title, data }: { title: string; data: JobRow[] }) {
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          className="text-sm font-medium text-red-600 transition hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 rounded-md px-2 py-1"
        >
          View all
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">Job</th>
              <th className="px-6 py-3 text-center">Applicants</th>
              <th className="px-6 py-3 text-center">Dates</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((job, index) => (
              <tr key={index} className="transition-colors hover:bg-slate-50/60">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${job.color || "bg-slate-500"}`}
                    >
                      {job.company.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{job.role}</p>
                      <p className="text-xs text-slate-500">{job.company}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center gap-1 text-sm font-medium text-slate-700">
                    <Users size={14} className="text-slate-400" aria-hidden />
                    {job.applicants}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-[11px] text-slate-600">
                  <span className="font-medium text-emerald-700">{job.postDate}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="font-medium text-slate-500">{job.expiryDate}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                      aria-label="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const recentJobsData: JobRow[] = [
  {
    role: "Web Developer",
    company: "Google Inc.",
    applicants: 45,
    postDate: "10 Oct 2023",
    expiryDate: "10 Nov 2023",
    color: "bg-blue-600",
  },
  {
    role: "UI Designer",
    company: "Adobe",
    applicants: 22,
    postDate: "12 Oct 2023",
    expiryDate: "12 Nov 2023",
    color: "bg-red-500",
  },
  {
    role: "React Expert",
    company: "Meta",
    applicants: 89,
    postDate: "15 Oct 2023",
    expiryDate: "15 Nov 2023",
    color: "bg-blue-400",
  },
];

const suggestedJobsData: JobRow[] = [
  {
    role: "Backend Eng.",
    company: "Amazon",
    applicants: 12,
    postDate: "01 Nov 2023",
    expiryDate: "01 Dec 2023",
    color: "bg-orange-500",
  },
];

export function DashboardPageContent() {
  return (
    <div className="box-border w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <EmployerAccountStatusBanner />
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {[
          { label: "Applied jobs", count: "120", icon: Briefcase, color: "bg-sky-50 text-sky-600" },
          { label: "Saved jobs", count: "45", icon: Heart, color: "bg-red-50 text-red-600" },
          { label: "Job views", count: "1,240", icon: Eye, color: "bg-amber-50 text-amber-700" },
          { label: "Total jobs", count: "18", icon: Layers, color: "bg-emerald-50 text-emerald-700" },
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
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">{stat.count}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <div className="flex h-[min(52vh,520px)] flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Activity trend</h3>
          <div className="min-h-0 flex-1">
            <DashboardSaleChart />
          </div>
        </div>
      </div>

      <JobTable title="Recently applied jobs" data={recentJobsData} />
      <JobTable title="Recommended for you" data={suggestedJobsData} />
    </div>
  );
}
