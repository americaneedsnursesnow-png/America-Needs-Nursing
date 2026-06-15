"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthApiError, resetPasswordRequest } from "@/lib/api/auth-api";
import { useAuth } from "@/contexts/auth-context";

const MIN_LEN = 8;

function ResetPasswordForm() {
  const { ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("This reset link is missing a token. Request a new link from the sign-in page.");
      return;
    }
    if (password.length < MIN_LEN) {
      setError(`Password must be at least ${MIN_LEN} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPasswordRequest({ token, password });
      router.push("/sign-in?reset=success");
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof AuthApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not reset password.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-6">
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          This reset link is invalid or incomplete. Request a new code from forgot password, or
          open the link from your email.
        </p>
        <p className="text-center text-sm text-gray-500">
          <Link href="/forgot-password" className="font-bold text-[var(--color-button)] hover:underline">
            Request a new link
          </Link>
          {" · "}
          <Link href="/sign-in" className="font-bold text-[var(--color-button)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="reset-password" className="mb-1 ml-1 block text-sm font-semibold text-gray-700">
          New password
        </label>
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={`At least ${MIN_LEN} characters`}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 text-black transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-button)]"
          disabled={!ready || submitting}
        />
      </div>

      <div>
        <label
          htmlFor="reset-password-confirm"
          className="mb-1 ml-1 block text-sm font-semibold text-gray-700"
        >
          Confirm new password
        </label>
        <input
          id="reset-password-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 text-black transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-button)]"
          disabled={!ready || submitting}
        />
      </div>

      <button
        type="submit"
        disabled={!ready || submitting}
        className="w-full rounded-xl py-4 font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        style={{ backgroundColor: "var(--color-button)" }}
      >
        {submitting ? "Saving…" : "Update password"}
      </button>

      <p className="text-center text-sm text-gray-500">
        <Link href="/sign-in" className="font-bold text-[var(--color-button)] hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-xl md:p-12">
        <div className="mb-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- marketing logo */}
          <img src="/logo/ANN.png" alt="Logo" className="mx-auto mb-4 h-12" />
          <h1 className="text-3xl font-extrabold text-gray-900">Set new password</h1>
          <p className="mt-2 text-gray-500">
            Choose a strong password. If you came from the forgot-password flow, your email code
            was already verified.
          </p>
        </div>

        <Suspense
          fallback={<p className="text-center text-sm text-gray-500">Loading…</p>}
        >
          <ResetPasswordForm />
        </Suspense>

       
      </div>
    </div>
  );
}
