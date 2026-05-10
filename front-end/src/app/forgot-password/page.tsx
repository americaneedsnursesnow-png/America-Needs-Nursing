"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ChevronLeft, Mail, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { AuthApiError, forgotPasswordRequest } from "@/lib/api/auth-api";
import { useAuth } from "@/contexts/auth-context";

const SUCCESS_COPY =
  "If an account exists for that email, we've sent password reset instructions to your inbox.";

export default function ForgotPasswordPage() {
  const { ready } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      await forgotPasswordRequest({ email: trimmedEmail });
      setDone(true);
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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(null); // Clear error when user corrects input
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        

        <div className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-gray-200 md:p-10">
          <div className="mb-2 text-center">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/ANN.png" alt="Logo" className="mx-auto h-14 w-auto" />
          </Link>
        </div>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Reset password
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              {done 
                ? "Check your inbox to continue" 
                : "Enter your email and we'll send you a link to reset your password."}
            </p>
          </div>

          {done ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-sm leading-relaxed">{SUCCESS_COPY}</p>
              </div>
              
              <Link
                href="/sign-in"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "var(--color-button)" }}
              >
                Return to sign in
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 animate-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label 
                  htmlFor="forgot-email" 
                  className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  Email Address
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
                    className="block w-full rounded-xl form-input pl-11  py-3"
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
                    <span>Sending Link...</span>
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>

              <div className="pt-2 text-center">
                <Link 
                  href="/sign-in" 
                  className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600">Home</Link>
        </div>
      </div>
    </div>
  );
}