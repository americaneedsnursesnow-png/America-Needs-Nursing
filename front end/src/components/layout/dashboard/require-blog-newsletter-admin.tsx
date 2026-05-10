"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/auth-context";
import { canAccessBlogNewsletterAdmin } from "@/lib/api/auth-api";

/** Super admin, operations admin, or content-only CMS admin (blog + newsletter). */
export function RequireBlogNewsletterAdmin({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    if (!canAccessBlogNewsletterAdmin(user.role)) {
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

  if (!canAccessBlogNewsletterAdmin(user.role)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-sm text-gray-500">
        Checking access…
      </div>
    );
  }

  return <>{children}</>;
}
