"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { EmployerStaffPublicRouteGate } from "@/components/auth/employer-staff-public-route-gate";
import { GlobalNurseCompleteProfileModal } from "@/features/onboarding/global-nurse-complete-profile-modal";
import { AppShell } from "./AppShell";

/**
 * Hides marketing header/footer on dashboard and auth routes.
 * Employers/staff may not stay on public marketing routes while signed in.
 */
export function ConditionalAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Check for Dashboard routes
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  
  // Check for Sign In and Sign Up routes
  const isAuthPage =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  // Determine if we should hide the Header and Footer
  const hideHeaderFooter = isDashboard || isAuthPage;

  return (
    <>
      <AppShell showHeader={!hideHeaderFooter} showFooter={!hideHeaderFooter}>
        {isDashboard ? (
          children
        ) : (
          /* We keep the Gate for Sign In/Sign Up to redirect already logged-in users */
          <EmployerStaffPublicRouteGate>{children}</EmployerStaffPublicRouteGate>
        )}
      </AppShell>
      <GlobalNurseCompleteProfileModal />
    </>
  );
}