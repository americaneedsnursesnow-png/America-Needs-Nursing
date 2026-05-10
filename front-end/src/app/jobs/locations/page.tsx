import Link from "next/link";

import { US_STATES } from "@/lib/us-states";

export const metadata = {
  title: "Jobs by state | America Needs Nurses",
  description: "Browse nursing openings grouped by US state.",
};

export default function JobsLocationsHubPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
          Location directory
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Jobs by state
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Jump to openings in your state. Filters on the jobs board match the same state codes
          employers select when posting.
        </p>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {US_STATES.map((s) => (
            <li key={s.code}>
              <Link
                href={`/jobs/locations/${s.slug}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-red-200 hover:text-red-700"
              >
                <span>
                  Jobs in {s.name}
                </span>
                <span className="text-xs font-bold text-slate-400">{s.code}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-sm text-slate-500">
          <Link href="/jobs" className="font-semibold text-red-600 hover:underline">
            Back to all jobs
          </Link>
        </p>
      </div>
    </main>
  );
}
