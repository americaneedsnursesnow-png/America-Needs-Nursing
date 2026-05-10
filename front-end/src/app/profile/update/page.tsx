"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  ProfileUpdateForm,
  ProfileUpdatePageShell,
} from "@/features/profile-update";
import { useAuth } from "@/contexts/auth-context";
import { getProfileUpdatePath } from "@/lib/api/auth-api";

const STANDALONE_PROFILE_PATH = "/profile/update";

export default function ProfileUpdatePage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/sign-in");
      return;
    }
    if (ready && user) {
      const dash = getProfileUpdatePath(user.role);
      if (dash !== STANDALONE_PROFILE_PATH) router.replace(dash);
    }
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Redirecting to sign in…</p>
      </div>
    );
  }

  if (getProfileUpdatePath(user.role) !== STANDALONE_PROFILE_PATH) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Opening profile…</p>
      </div>
    );
  }

  return (
    <ProfileUpdatePageShell
      standalone
      backHref="/"
      backLabel="Home"
      title="Update profile"
      description="Manage your account, password, and nurse profile details here."
      contentMaxClass="max-w-7xl"
    >
      <ProfileUpdateForm />
    </ProfileUpdatePageShell>
  );
}
