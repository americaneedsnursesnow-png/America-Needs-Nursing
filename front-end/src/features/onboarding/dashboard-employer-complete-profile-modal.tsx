"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import { getProfileUpdatePath } from "@/lib/api/auth-api";
import { useEmployerDashboardBootstrap } from "@/hooks/use-employer-dashboard-bootstrap";

const DISMISS_KEY = "ann_employer_dashboard_complete_profile_modal_dismissed";

function isCompanyProfileComplete(c: {
  name: string;
  slug: string;
  contactEmail: string | null;
  contactPhone: string | null;
}): boolean {
  return Boolean(
    c.name.trim() &&
      c.slug.trim() &&
      (c.contactEmail || "").trim() &&
      (c.contactPhone || "").trim(),
  );
}

/** Shown on `/dashboard` for employers with missing company or required company fields. */
export function DashboardEmployerCompleteProfileModal() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data, isPending, isError } = useEmployerDashboardBootstrap();

  const shouldRun = useMemo(() => {
    if (!ready || !user) return false;
    if (user.role !== "employer") return false;
    if (!pathname.startsWith("/dashboard")) return false;
    if (pathname.startsWith("/dashboard/employee/profile")) return false;
    return true;
  }, [ready, user, pathname]);

  useEffect(() => {
    if (!shouldRun) {
      setOpen(false);
      return;
    }
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      setOpen(false);
      return;
    }
    if (isPending) return;
    if (isError) {
      setOpen(false);
      return;
    }
    const company = data?.company;
    if (!company) {
      setOpen(true);
      return;
    }
    const complete = isCompanyProfileComplete(company);
    if (complete) {
      sessionStorage.setItem(DISMISS_KEY, "1");
    }
    setOpen(!complete);
  }, [shouldRun, data, isPending, isError]);

  if (!open || !user || user.role !== "employer") return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-employer-complete-profile-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close dialog backdrop"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, "1");
          setOpen(false);
        }}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:max-w-xl md:p-8">
        <h2
          id="dashboard-employer-complete-profile-title"
          className="text-2xl font-extrabold text-gray-900 md:text-3xl"
        >
          Complete your profile
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          Add or finish your company details (name, slug, business email, and phone) so your
          employer account is ready to use.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push(getProfileUpdatePath(user.role))}
            className="flex-1 rounded-xl bg-red-600 py-4 text-xs font-bold text-white shadow-lg transition-all hover:bg-red-700 active:scale-[0.98]"
          >
            Complete now
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem(DISMISS_KEY, "1");
              setOpen(false);
            }}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-4 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            Finish later
          </button>
        </div>
      </div>
    </div>
  );
}
