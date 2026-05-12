"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  Loader2,
  Mail,
  Timer,
} from "lucide-react";

import {
  AuthApiError,
  forgotPasswordRequest,
  verifyPasswordResetOtp,
} from "@/lib/api/auth-api";
import { useAuth } from "@/contexts/auth-context";

function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function ForgotPasswordPage() {
  const { ready } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const deadlineMsRef = useRef<number>(0);

  const syncRemainingFromDeadline = useCallback(() => {
    const left = Math.ceil((deadlineMsRef.current - Date.now()) / 1000);
    setRemainingSeconds(Math.max(0, left));
  }, []);

  useEffect(() => {
    if (step !== "otp" || deadlineMsRef.current <= 0) return;
    syncRemainingFromDeadline();
    const id = window.setInterval(syncRemainingFromDeadline, 1000);
    return () => window.clearInterval(id);
  }, [step, syncRemainingFromDeadline]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      const { otpExpiresInSeconds } = await forgotPasswordRequest({
        email: trimmedEmail,
      });
      deadlineMsRef.current = Date.now() + otpExpiresInSeconds * 1000;
      setRemainingSeconds(otpExpiresInSeconds);
      setStep("otp");
      setOtp("");
    } catch (err) {
      const msg =
        err instanceof AuthApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendCode() {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    setSubmitting(true);
    try {
      const { otpExpiresInSeconds } = await forgotPasswordRequest({
        email: trimmedEmail,
      });
      deadlineMsRef.current = Date.now() + otpExpiresInSeconds * 1000;
      setRemainingSeconds(otpExpiresInSeconds);
      setOtp("");
    } catch (err) {
      const msg =
        err instanceof AuthApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not resend code.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    const code = otp.replace(/\D/g, "").trim();
    if (code.length < 4) {
      setError("Enter the code from your email.");
      return;
    }
    if (remainingSeconds <= 0) {
      setError("This code has expired. Request a new code.");
      return;
    }

    setSubmitting(true);
    try {
      const { resetToken } = await verifyPasswordResetOtp({
        email: trimmedEmail,
        code,
      });
      router.push(
        `/reset-password?token=${encodeURIComponent(resetToken)}`,
      );
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof AuthApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Invalid or expired code.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(v);
    if (error) setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-gray-200 md:p-10">
          <div className="mb-2 text-center">
            <Link
              href="/"
              className="inline-block transition-transform hover:scale-105"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/ANN.png"
                alt="Logo"
                className="mx-auto h-14 w-auto"
              />
            </Link>
          </div>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {step === "email" ? "Forgot password" : "Enter reset code"}
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              {step === "email"
                ? "Enter your email and we will send a 6-digit code to reset your password."
                : "We sent a code to your email. Enter it below, then you can choose a new password."}
            </p>
          </div>

          {step === "email" ? (
            <form className="space-y-5" onSubmit={handleSendCode}>
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="forgot-email"
                  className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="name@company.com"
                    className="form-input block w-full rounded-xl py-3 pl-11"
                    disabled={!ready || submitting}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!ready || submitting}
                className="relative flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: "var(--color-button)" }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Sending code…</span>
                  </>
                ) : (
                  "Send code"
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-[var(--color-button)]" />
                  <span className="font-medium">Code expires in</span>
                </div>
                <span
                  className="font-mono text-lg font-bold tabular-nums text-[var(--color-button)]"
                  aria-live="polite"
                >
                  {formatMmSs(remainingSeconds)}
                </span>
              </div>
              {remainingSeconds <= 0 ? (
                <p className="text-center text-sm text-amber-800">
                  This code has expired.{" "}
                  <button
                    type="button"
                    className="font-bold text-[var(--color-button)] underline"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setError(null);
                    }}
                  >
                    Start over
                  </button>
                </p>
              ) : null}

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="forgot-otp"
                  className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  6-digit code
                </label>
                <input
                  id="forgot-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  maxLength={6}
                  className="form-input block w-full rounded-xl py-3 text-center font-mono text-2xl tracking-[0.4em]"
                  disabled={!ready || submitting || remainingSeconds <= 0}
                />
              </div>

              <button
                type="submit"
                disabled={
                  !ready || submitting || remainingSeconds <= 0 || otp.length < 4
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: "var(--color-button)" }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  "Continue to new password"
                )}
              </button>

              <div className="flex flex-col gap-2 text-center text-sm">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleResendCode}
                  className="font-semibold text-[var(--color-button)] hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-800"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError(null);
                  }}
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
