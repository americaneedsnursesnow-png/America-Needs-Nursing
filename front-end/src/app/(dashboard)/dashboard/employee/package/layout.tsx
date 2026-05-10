"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";

/**
 * Subscription / package flows are employer-only (company accounts).
 */
export default function PackageSegmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user || user.role !== "employer") {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  if (!ready || !user || user.role !== "employer") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
