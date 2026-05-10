"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/auth-context";
import { canAccessAdminShell } from "@/lib/api/auth-api";

/** Any dashboard admin area role (ops admin, content admin, or super admin). */
export function RequireStaffAdmin({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    if (!canAccessAdminShell(user.role)) {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-sm text-gray-500">
        Checking access…
      </div>
    );
  }

  if (!canAccessAdminShell(user.role)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-sm text-gray-500">
        Checking access…
      </div>
    );
  }

  return <>{children}</>;
}
