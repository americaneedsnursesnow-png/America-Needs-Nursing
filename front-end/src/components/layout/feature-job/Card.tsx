import Link from "next/link";
import React from "react";
import { Briefcase, MapPin, ChevronRight } from "lucide-react";

import type { JobRoleDetailRow } from "@/lib/job-posting-metadata";

export interface JobCardProps {
  slug: string;
  title: string;
  company: string;
  location: string;
  metaLine?: string;
  roleDetailRows?: JobRoleDetailRow[];
  salary?: string;
  logoUrl?: string | null;
  isFeatured?: boolean;
  isUrgent?: boolean;
  /** Kept for backward compatibility; no visual difference. */
  size?: "default" | "featured";
}

export function JobCard({
  slug,
  logoUrl,
  isFeatured,
  isUrgent,
  title,
  company,
  location,
  metaLine,
  roleDetailRows,
}: JobCardProps) {
  const hasRoleDetails = roleDetailRows && roleDetailRows.length > 0;

  const meta = hasRoleDetails
    ? roleDetailRows!.slice(0, 2).map((r) => `${r.label}: ${r.value}`).join(" · ")
    : metaLine;

  return (
    <Link
      href={`/jobs/${slug}`}
      className="group flex flex-col gap-4 p-5 transition-colors hover:bg-red-50/40 sm:flex-row sm:items-center"
    >
      {/* Logo */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <Briefcase className="h-7 w-7 text-gray-300" />
        )}
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-black text-gray-900 group-hover:text-red-600 md:text-xl">
            {title}
          </h2>
          {isFeatured && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
              Featured
            </span>
          )}
          {isUrgent && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold uppercase text-red-700">
              Urgent
            </span>
          )}
        </div>

        <p className="mt-0.5 text-sm font-bold text-red-600">
          {company}
        </p>

        {meta ? (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
            {meta}
          </p>
        ) : null}

        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
          <MapPin className="h-3.5 w-3.5" />
          {location?.trim() || "Location TBD"}
        </p>
      </div>

      {/* View Action */}
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        <span className="text-xs font-black uppercase text-red-600">
          View
        </span>
        <ChevronRight className="h-5 w-5 text-red-500 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

