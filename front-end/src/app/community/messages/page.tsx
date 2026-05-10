"use client";

import { Suspense } from "react";

import { CommunityMessagingHub } from "@/features/community/community-messaging-hub";

export default function CommunityMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-slate-50 text-slate-500">
          Loading…
        </div>
      }
    >
      <CommunityMessagingHub />
    </Suspense>
  );
}
