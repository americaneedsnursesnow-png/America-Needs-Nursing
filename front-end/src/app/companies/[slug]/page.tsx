import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Info,Clock, Heart, Users, ArrowLeft, Mail, Phone, ExternalLink, HeartPulse, ShieldCheck, MapPin } from "lucide-react";
import { CompanyFeaturedAside } from "@/components/companies/company-featured-aside";
import { JobRichBody } from "@/components/jobs/job-rich-body";
import { ResponsiveHeroCover } from "@/components/layout/responsive-hero-cover";
import { PublicPagination } from "@/components/public/public-pagination";
import { blogCoverSrc } from "@/lib/blog-cover-image";
import {
  emptyPaginated,
  getPublicCompanyBySlug,
  getPublicFeaturedCompanies,
} from "@/lib/api/public-api";
import { isRichTextEffectivelyEmpty } from "@/lib/sanitize-job-html";

import type { PaginatedMeta, PublicCompany, PublicJob } from "@/lib/api/types";

function hasCompanyDisplayContent(text: string | null | undefined): boolean {
  if (text == null) return false;
  return !isRichTextEffectivelyEmpty(text);
}

const JOB_PAGE_SIZE = 20;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ jobPage?: string; jobLimit?: string }>;
};

function jobsMetaOrSynthetic(
  jobs: PublicJob[],
  apiMeta: PaginatedMeta | undefined,
  jobPage: number,
  jobLimit: number,
): PaginatedMeta {
  if (apiMeta) return apiMeta;
  return {
    page: jobPage,
    limit: jobLimit,
    totalItems: jobs.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

export default async function CompanyDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const jobPage = Math.max(1, Number.parseInt(sp.jobPage ?? "1", 10) || 1);
  const jobLimit = JOB_PAGE_SIZE;

  let data;
  let featuredCompanies: PublicCompany[] = [];
  
  try {
    const [fetched, featured] = await Promise.all([
      getPublicCompanyBySlug(slug, { jobPage, jobLimit }),
      getPublicFeaturedCompanies(1, 10).catch(() => emptyPaginated<PublicCompany>(1, 10)),
    ]);
    data = fetched;
    featuredCompanies = featured.items;
  } catch {
    notFound();
  }

  const { company, jobs, jobsMeta } = data;
  const jobsListMeta = jobsMetaOrSynthetic(jobs, jobsMeta, jobPage, jobLimit);
  
  const logoSrc = blogCoverSrc(company.logoUrl);
  const heroSrc = blogCoverSrc(company.heroImageUrl);

  const hrefJobPage = (p: number) =>
    `/companies/${encodeURIComponent(company.slug)}?${new URLSearchParams({
      jobPage: String(p),
      jobLimit: String(jobLimit),
    }).toString()}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      
      {/* --- Dynamic Banner Section --- */}
      <div className="relative h-40 w-full overflow-hidden sm:h-56 md:h-72 lg:h-80">
        {heroSrc ? (
          <>
            <div className="absolute inset-0">
              <ResponsiveHeroCover
                src={heroSrc}
                alt=""
                priority
                imageClassName="object-cover object-center max-sm:object-[center_30%]"
              />
            </div>
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/60 to-transparent" />
          </>
        ) : (
          /* --- Specialized Nursing/Healthcare Fallback --- */
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-red-900 to-red-600">
            {/* Medical Pulse Pattern Overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
              <pattern id="pulse" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M0 50 L20 50 L30 20 L45 80 L55 40 L65 50 L100 50" fill="none" stroke="white" strokeWidth="2" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#pulse)" />
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <HeartPulse className="w-64 h-64 text-white/5 absolute -right-10 -bottom-10 rotate-12" />
              <div className="text-center px-4">
                <h2 className="text-white/20 text-5xl md:text-7xl font-black uppercase tracking-widest select-none">
                  Nursing Care
                </h2>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="absolute top-6 left-12 z-30">
          <Link 
            href="/companies" 
            className="btn inline-flex items-center gap-2 !py-2 !px-4 text-sm shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to healthcare listing
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* --- Profile Header Card (Negative Margin Overlap) --- */}
        <div className="relative -mt-16 md:-mt-24 z-20">
          <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl shadow-slate-200/60 border border-slate-100">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              
              {/* Logo with Ring */}
              <div className="relative shrink-0">
                <div className="h-32 w-32 md:h-44 md:w-44 rounded-3xl bg-white p-2 shadow-2xl border border-slate-50 overflow-hidden flex items-center justify-center">
                  {logoSrc ? (
                    <img src={logoSrc} alt={company.name} className="h-full w-full object-contain" />
                  ) : (
                    <Briefcase className="w-16 h-16 text-slate-200" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white h-8 w-8 rounded-full flex items-center justify-center shadow-lg" title="Verified Provider">
                    <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-red-100">
                        Healthcare & Nursing
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                    {company.name}
                  </h1>
                </div>

                <div className="flex flex-wrap gap-y-3 gap-x-6 text-slate-500">
                  {company.contactEmail && (
                    <a href={`mailto:${company.contactEmail}`} className="flex items-center gap-2 text-sm font-medium hover:text-red-600 transition-colors">
                      <Mail className="w-4 h-4 text-red-600" /> {company.contactEmail}
                    </a>
                  )}
                  {company.contactPhone && (
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="w-4 h-4 text-red-600" /> {company.contactPhone}
                    </span>
                  )}
                  {company.locations && company.locations.length > 0 ? (
                    <ul className="mt-2 flex w-full min-w-0 max-w-lg flex-col gap-1.5 sm:mt-0">
                      {company.locations.map((loc) => (
                        <li
                          key={loc.name}
                          className="flex items-start gap-2 text-sm font-medium text-slate-600"
                        >
                          <MapPin className="mt-0.5 w-4 shrink-0 text-red-600" />
                          <span>
                            {loc.name}
                            {loc.address ? (
                              <span className="text-slate-500"> — {loc.address}</span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <MapPin className="w-4 h-4 text-red-600" />
                      {company.contactPhone || company.contactEmail
                        ? "Contact us for location details"
                        : "Location on request"}
                    </span>
                  )}
                </div>
              </div>

              <div className="hidden xl:block">
                <a href="#roles" className=" btn inline-flex items-center gap-2 !py-2 !px-4 text-sm shadow-md active:scale-95">
                  View Openings
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* --- Main Content Grid --- */}


<div className="mt-10 grid lg:grid-cols-[1fr_380px] gap-8">
  <div className="min-w-0 space-y-8">
    
    {/* --- About Provider Section --- */}
    {hasCompanyDisplayContent(company.description) && (
      <section className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200/60 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 text-rose-50/50 group-hover:text-rose-100/50 transition-colors pointer-events-none">
          <ShieldCheck className="w-20 h-20" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-2.5 bg-rose-50 rounded-xl">
              <Info className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">About the Provider</h2>
          </div>
          
          <div className="prose prose-slate prose-lg max-w-none prose-p:leading-relaxed prose-p:text-slate-600">
            <JobRichBody html={company.description ?? ""} />
          </div>
        </div>
      </section>
    )}

    {/* --- Culture & Benefits Section (Modernized) --- */}
    {hasCompanyDisplayContent(company.cultureText) && (
      <section className="bg-white rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-2.5 bg-white rounded-xl border border-red-600">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-black">Culture & Nursing Values</h2>
          </div>
          
          <div className="prose prose-invert prose-lg max-w-none prose-p:text-black">
            <JobRichBody html={company.cultureText ?? ""} />
          </div>
        </div>
      </section>
    )}

    {/* --- Openings Section --- */}
    <section id="roles" className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200/60 shadow-sm">
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Available Positions</h2>
          <p className="text-slate-500 font-medium">Join a team committed to excellence in care.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-700">{jobsListMeta.totalItems} Open Roles</span>
        </div>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <Link 
            key={job.id} 
            href={`/jobs/${job.slug}`} 
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl border border-slate-100 bg-white hover:border-rose-200 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300"
          >
            <div className="space-y-2">
              <h3 className="font-bold text-xl text-slate-800 group-hover:text-red-600 transition-colors">
                {job.title}
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                  <Clock className="w-4 h-4 text-red-600" />
                  Full Time
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                  <MapPin className="w-4 h-4 text-red-600" />
                  On-site
                </span>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
               <span className="text-sm font-bold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">View Details</span>
               <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-red-600 group-hover:border-red-600 group-hover:rotate-45 transition-all duration-300">
                  <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </div>
            </div>
          </Link>
        ))}
        
        {jobs.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-bold text-lg">No current openings available.</p>
              <p className="text-slate-400 text-sm">Check back soon or set an alert.</p>
          </div>
        )}
      </div>
      
      {jobsListMeta.totalPages > 1 && (
        <div className="mt-8 pt-8 border-t border-slate-100">
          <PublicPagination meta={jobsListMeta} hrefForPage={hrefJobPage} />
        </div>
      )}
    </section>
  </div>

  {/* --- Sidebar --- */}
  <aside className="space-y-8">
    <div className="sticky top-8 space-y-6">
      
      {/* Featured Employers */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm">
        <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-red-600 rounded-full" />
            Similar Employers
        </h3>
        <CompanyFeaturedAside 
            companies={featuredCompanies} 
            excludeSlug={company.slug} 
        />
      </div>
      
      {/* Support Card */}
      <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <h4 className="font-bold text-xl mb-3 relative z-10">Application Support</h4>
        <p className="text-white text-sm mb-6 leading-relaxed relative z-10">
          Questions about applying to <span className="text-white font-medium">{company.name}</span>? Our team is here to help you.
        </p>
       
      </div>
    </div>
  </aside>
</div>
</div>
    </div>
  );
}