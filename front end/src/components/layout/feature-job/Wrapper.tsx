import { getPublicJobsCached } from "@/lib/api/public-data-cache";
import type { PublicJob } from "@/lib/api/types";
import { jobListingMetaLine, jobRoleDetailEntries } from "@/lib/job-posting-metadata";
import { blogCoverSrc } from "@/lib/blog-cover-image";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { JobCard } from "./Card";
import { Briefcase, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

function pickFeaturedJobs(jobs: PublicJob[]) {
  const featured = jobs.filter((j) => j.featured);
  const list = featured.length > 0 ? featured : jobs;
  // Professional dashboards often show 6 items for a balanced grid
  return list.slice(0, 6);
}

export async function FeaturedJobs() {
  let jobs: PublicJob[] = [];
  try {
    const { items } = await getPublicJobsCached(1, 80);
    jobs = items;
  } catch {
    jobs = [];
  }

 const display = pickFeaturedJobs(jobs);

return (
  <section className="w-full py-8 md:py-12 bg-white">
    <SiteContentWrapper>
      
      {/* Modern Header: Split Left and Right */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Sparkles size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600">
              Premium Listings
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-red-600">
            Featured <span className="text-slate-400 font-light">Opportunities</span>
          </h2>
          <p className="max-w-xl text-sm md:text-base text-slate-500 leading-relaxed">
            Hand-picked roles from top healthcare employers. Clear roles, locations, and impact.
          </p>
        </div>

        <Link 
          href="/jobs" 
          className="group flex items-center gap-2 text-sm font-bold text-slate-900 transition-all hover:text-red-600"
        >
          Explore all jobs 
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-all group-hover:bg-red-600 group-hover:text-white">
            <ArrowRight size={16} />
          </span>
        </Link>
      </div>

      {/* Content Area */}
      {display.length === 0 ? (
        /* Professional Empty State */
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-100/80 p-12 text-center">
          <div className="mb-4 rounded-full bg-white p-4 shadow-sm text-slate-300">
            <Briefcase size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No active openings</h3>
          <p className="mt-2 max-w-xs text-sm text-slate-500">
            Our partners are currently reviewing applications. Check back shortly for new administrative and technical roles.
          </p>
        </div>
      ) : (
        /* CHANGED: md:grid-cols-2 and lg:grid-cols-2 for 2 cards per row */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 md:gap-8">
          {display.map((job) => {
            const rows = jobRoleDetailEntries(job);
            return (
              <div key={job.id} className="group transition-all duration-300 hover:-translate-y-1">
                <JobCard
                  slug={job.slug}
                  title={job.title}
                  company={job.company?.name ?? "Employer"}
                  location={job.location ?? ""}
                  metaLine={rows.length > 0 ? undefined : jobListingMetaLine(job)}
                  roleDetailRows={rows.length > 0 ? rows : undefined}
                  logoUrl={job.company?.logoUrl}
                  isFeatured={job.featured}
                  isUrgent={false}
                  size="featured"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Subtle Footer Meta */}
      <div className="mt-16 flex items-center justify-center gap-8 opacity-40 grayscale transition-all hover:grayscale-0">
         <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
         <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
           Updated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
         </p>
         <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
      </div>
    </SiteContentWrapper>
  </section>
);}