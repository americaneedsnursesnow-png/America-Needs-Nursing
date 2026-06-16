import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "Sorry, the page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 sm:rounded-3xl">
        <div className="p-6 sm:p-10">

          {/* Logo */}
          <div className="mb-6 text-center">
            <Link href="/" className="inline-block transition-transform hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/ANN.png" alt="America Needs Nurses" className="mx-auto h-14 w-auto" />
            </Link>
          </div>

          {/* 404 graphic */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex items-center justify-center rounded-2xl bg-red-50 p-5">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--color-button)]"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-6xl font-black tracking-tight text-[var(--color-button)]">
              404
            </p>
          </div>

          {/* Message */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-xl font-black text-gray-900">
              Page Not Found
            </h1>
            <p className="text-sm text-gray-500">
              The page you&apos;re looking for doesn&apos;t exist or may have been moved.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="group relative w-full overflow-hidden rounded-xl py-3.5 text-center text-xs font-bold tracking-[0.1em] text-white shadow-md transition-all active:scale-[0.98]"
              style={{ backgroundColor: "var(--color-button)" }}
            >
              <span className="relative z-10">GO BACK HOME</span>
              <div className="absolute inset-0 -translate-x-full bg-white/10 transition-transform group-hover:translate-x-0" />
            </Link>

            <Link
              href="/jobs"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              BROWSE JOBS
            </Link>
          </div>

          {/* Help links */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <Link href="/contact-us" className="hover:text-[var(--color-button)] transition-colors">
              Contact Us
            </Link>
            <span>·</span>
            <Link href="/blog" className="hover:text-[var(--color-button)] transition-colors">
              Blog
            </Link>
            <span>·</span>
            <Link href="/sign-in" className="hover:text-[var(--color-button)] transition-colors">
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
