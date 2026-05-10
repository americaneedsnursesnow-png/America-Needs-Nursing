"use client";

import dynamic from "next/dynamic";

export const RichTextEditor = dynamic(
  () =>
    import("./rich-text-editor").then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[220px] w-full animate-pulse rounded-2xl bg-slate-100"
        aria-hidden
      />
    ),
  },
);
