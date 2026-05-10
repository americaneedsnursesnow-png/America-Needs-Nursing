"use client";

import dynamic from "next/dynamic";

import type { JobsMapProps } from "./JobsMapInner";

export type { JobsMapProps };

export const JobsMap = dynamic(
  () => import("./JobsMapInner").then((m) => m.JobsMapInner),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[400px] w-full items-center justify-center rounded-2xl border border-gray-200 bg-slate-100 lg:h-[500px]"
        aria-hidden
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
      </div>
    ),
  },
);
