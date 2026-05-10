import { JobsBrowseWithFilters } from "@/components/jobs/jobs-browse-with-filters";
import {
  getPublicJobMapMarkersCached,
  getPublicJobsCached,
} from "@/lib/api/public-data-cache";
import { emptyPaginated } from "@/lib/api/public-api";
import { parseJobBrowseFilters } from "@/lib/job-browse-search-params";
import type { PublicJob } from "@/lib/api/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const PAGE_SIZE = 24;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BrowseJobsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(String(sp.page ?? "1"), 10) || 1);

  let data = emptyPaginated<PublicJob>(page, PAGE_SIZE);
  let mapMarkers = await getPublicJobMapMarkersCached(400).catch(() => []);
  let error: string | null = null;
  try {
    data = await getPublicJobsCached(page, PAGE_SIZE);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load jobs.";
  }

  const initialFilters = parseJobBrowseFilters(sp);

  return (
    <main className="max-h-2xl bg-gray-50 ">
      {/* Banner Section - Height decreased (py-12 md:py-16) */}
      <section className="relative overflow-hidden bg-red-600 py-12 md:py-16 text-white">
        
        {/* --- Decorative Background Elements --- */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rotate-12 rounded-3xl" />
          
          <div className="absolute top-10 right-[20%] opacity-20 grid grid-cols-6 gap-2">
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} className="text-xs font-bold">+</span>
            ))}
          </div>

          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/10 rotate-[35deg] rounded-xl" />

          <div className="absolute -bottom-12 left-10 w-48 h-48 bg-white/5 rounded-full" />

          <div className="absolute bottom-5 right-10 opacity-20 flex flex-col items-end">
             <div className="flex gap-2"><span>+</span></div>
             <div className="flex gap-2"><span>+</span><span>+</span></div>
             <div className="flex gap-2"><span>+</span><span>+</span><span>+</span></div>
             <div className="flex gap-2"><span>+</span><span>+</span><span>+</span><span>+</span></div>
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-20">
          {/* Back to Home Button - Positioned at top left */}
         

          <div className="max-w-4xl ml-2">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Jobs Broswer
            </h1>
            
            <nav className="flex items-center gap-3 text-sm md:text-base font-medium opacity-80 pl-2">
              <Link href="/" className="hover:text-white hover:underline transition-all">Home</Link>
              <span className="opacity-40">/</span>
              <Link href="/jobs" className="hover:text-white hover:underline transition-all">Jobs</Link>
              <span className="opacity-40">/</span>
            </nav>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container mx-auto max-wid-full px-2 -mt-18 relative z-40">
        <div className=" p-6 md:p-8">
          <JobsBrowseWithFilters
            jobs={data.items}
            error={error}
            meta={data.meta}
            initialFilters={initialFilters}
            mapMarkers={mapMarkers}
          />
        </div>
      </div>
    </main>
  );
}