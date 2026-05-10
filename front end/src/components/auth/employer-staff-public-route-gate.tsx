"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { canAccessDashboard } from "@/lib/api/auth-api";

function isPublicAuthPath(pathname: string): boolean {
  return (
    pathname === "/sign-in" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password")
  );
}

/**
 * Employers, staff `admin`, and `super_admin` may only use the dashboard app, not marketing
 * or other public routes (nurses are unchanged).
 */
export function EmployerStaffPublicRouteGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user || !canAccessDashboard(user.role)) {
      setBlocked(false);
      return;
    }
    if (isPublicAuthPath(pathname)) {
      setBlocked(false);
      return;
    }
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
      setBlocked(false);
      return;
    }
    setBlocked(true);
    router.replace("/dashboard");
  }, [ready, user, pathname, router]);

  if (!ready) {
    return <>{children}</>;
  }
  if (user && canAccessDashboard(user.role) && blocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" aria-hidden />
      </div>
    );
  }

  return <>{children}</>;
}
