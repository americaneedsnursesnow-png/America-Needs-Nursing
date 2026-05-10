"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import { getMyNurseProfile } from "@/lib/api/nurse-profile-api";
import { getProfileUpdatePath } from "@/lib/api/auth-api";

const DISMISS_KEY = "ann_nurse_complete_profile_modal_dismissed";

function isProfileComplete(profile: {
  specialization: string | null;
  licenseNumber: string | null;
  yearsExperience: number | null;
}): boolean {
  return Boolean(
    profile.specialization?.trim() &&
      profile.licenseNumber?.trim() &&
      profile.yearsExperience != null &&
      profile.yearsExperience >= 0,
  );
}

export function GlobalNurseCompleteProfileModal() {
  const { user, accessToken, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const shouldRun = useMemo(() => {
    if (!ready || !user || !accessToken) return false;
    if (user.role !== "nurse") return false;
    if (pathname.startsWith("/dashboard")) return false;
    if (pathname.startsWith("/register")) return false;
    if (pathname.startsWith("/sign-in")) return false;
    if (pathname.startsWith("/forgot-password")) return false;
    if (pathname.startsWith("/profile/update")) return false;
    return true;
  }, [ready, user, accessToken, pathname]);

  useEffect(() => {
    if (!shouldRun) {
      setOpen(false);
      return;
    }

    let cancelled = false;

    async function checkProfile() {
      try {
        const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
        if (dismissed) {
          if (!cancelled) setOpen(false);
          return;
        }

        const profile = await getMyNurseProfile(accessToken!);
        const complete = isProfileComplete(profile);
        if (complete) {
          sessionStorage.setItem(DISMISS_KEY, "1");
        }
        if (!cancelled) setOpen(!complete);
      } catch {
        if (!cancelled) setOpen(false);
      }
    }

    checkProfile();
    return () => {
      cancelled = true;
    };
  }, [shouldRun, accessToken]);

  if (!open || !user || user.role !== "nurse") return null;

  return (
    <div className="fixed right-4 top-20 z-[90] w-full max-w-sm rounded-2xl border border-red-200 bg-white p-4 shadow-2xl">
      <p className="text-xs font-black uppercase tracking-wider text-red-600">
        Complete your profile
      </p>
      <p className="mt-2 text-sm font-medium text-slate-600">
        Finish your nurse profile to increase trust and visibility.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push(getProfileUpdatePath(user.role))}
          className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white hover:bg-red-700"
        >
          Complete Now
        </button>
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(DISMISS_KEY, "1");
            setOpen(false);
          }}
          className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
        >
          Finish Later
        </button>
      </div>
    </div>
  );
}
