"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";

function SignInFormWithNext() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("next");
  const redirectTo =
    raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
  const resetOk = searchParams.get("reset") === "success";
  
  return (
    <>
      {resetOk ? (
        <p
          className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900 sm:text-sm"
          role="status"
        >
          Your password was updated. Sign in with your new password.
        </p>
      ) : null}
      <SignInForm redirectTo={redirectTo} />
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Back to Home Link */}
     

      {/* Main Card - Max width reduced to md for better focus */}
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 sm:rounded-3xl">
        <div className="p-6 sm:p-10">
          
         <div className="mb-2 text-center">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/ANN.png" alt="Logo" className="mx-auto h-14 w-auto" />
          </Link>
        </div>

          {/* Form Section */}
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-button)]" />
              <p className="mt-4 text-xs text-gray-500">Loading form...</p>
            </div>
          }>
            <SignInFormWithNext />
          </Suspense>

          {/* Footer Link */}
          <p className="mt-6 text-center text-xs text-gray-500">
              Don't have account? <Link href="/register" className="font-bold text-[var(--color-button)] hover:underline">Sign Up</Link>
            </p>
        </div>
      </div>

      {/* Helper Footer Link */}
     
    </div>
  );
}