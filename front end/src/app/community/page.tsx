"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import { canAccessCommunity } from "@/lib/api/auth-api";

/**
 * Nurses: redirect to Messages tab. Super admins: dashboard community shell.
 * Guests: sign in with return to messages tab.
 */
export default function CommunityPage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(
        `/sign-in?next=${encodeURIComponent("/community/messages")}`,
      );
      return;
    }
    if (user.role === "super_admin") {
      router.replace("/dashboard/admin/community");
      return;
    }
    if (user.role === "nurse") {
      if (
        !canAccessCommunity("nurse", {
          communityBannedAt: user.communityBannedAt,
        })
      ) {
        router.replace("/profile/update");
        return;
      }
      router.replace("/community/messages");
      return;
    }
    router.replace("/dashboard");
  }, [ready, user, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-white text-gray-600">
      Loading…
    </div>
  );
}
