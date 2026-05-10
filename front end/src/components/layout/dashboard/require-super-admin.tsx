"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/auth-context";

/**
 * Blocks dashboard admin routes for anyone who is not `super_admin`.
 */
export function RequireSuperAdmin({
  children,
}: {
  children: ReactNode;
}) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    if (user.role !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  if (!ready || !user || user.role !== "super_admin") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-sm text-gray-500">
        Checking access…
      </div>
    );
  }

  return <>{children}</>;
}
