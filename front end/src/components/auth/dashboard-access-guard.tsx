"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import FullScreenLoader from "./full-screen-loader";

import { useAuth } from "@/contexts/auth-context";
import {
  canAccessDashboard,
  getPostAuthRedirectPath,
} from "@/lib/api/auth-api";

/**
 * Blocks nurses (and guests) from every `/dashboard` route; only employer/admin/super_admin pass.
 */
export function DashboardAccessGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(
        `/sign-in?next=${encodeURIComponent(pathname || "/dashboard")}`,
      );
      return;
    }
    if (!canAccessDashboard(user.role)) {
      router.replace(
        getPostAuthRedirectPath(user.role, {
          communityBannedAt: user.communityBannedAt,
        }),
      );
    }
  }, [ready, user, router, pathname]);

  if (!ready || !user || !canAccessDashboard(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <FullScreenLoader />
      </div>
    );
  }

  return <>{children}</>;
}
