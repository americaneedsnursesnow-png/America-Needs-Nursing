import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, MapPin, Building2, DollarSign, Clock, Star, Calendar } from "lucide-react";

import { JobApplySidebar } from "@/components/jobs/job-apply-sidebar";
import { JobRichBody } from "@/components/jobs/job-rich-body";
import { ResponsiveHeroCover } from "@/components/layout/responsive-hero-cover";
import { blogCoverSrc } from "@/lib/blog-cover-image";
import { getPublicJobBySlug } from "@/lib/api/public-api";
import {
  employmentTypeLabel,
  expectedSalaryRangeLabel,
  jobLevelLabel,
} from "@/lib/job-posting-metadata";

type PageProps = { params: Promise<{ slug: string }> };

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let job: Awaited<ReturnType<typeof getPublicJobBySlug>>;
  try {
    job = await getPublicJobBySlug(slug);
  } catch {
    notFound();
  }

  const company = job.company;
  const companyName = company?.name ?? "Employer";
  const logoSrc = blogCoverSrc(company?.logoUrl);
  const heroSrc = blogCoverSrc(company?.heroImageUrl);

  const salary = expectedSalaryRangeLabel(job.expectedSalaryRange);
  const empType = employmentTypeLabel(job.employmentType);
  const level = jobLevelLabel(job.jobLevel);
  const category = job.jobCategory?.trim() ?? "";

  const quickFacts = [
    { icon: Briefcase, label: "Type", value: empType || "N/A", show: !!empType },
    { icon: Star, label: "Level", value: level || "N/A", show: !!level },
    { icon: Building2, label: "Category", value: category || "N/A", show: !!category },
    { icon: DollarSign, label: "Salary", value: salary || "Competitive", show: !!(salary || job.expectedSalaryRange) },
    { icon: MapPin, label: "Location", value: job.location?.trim() || "TBD", show: true },
    { icon: Calendar, label: "Posted", value: "Recently", show: true },
  ].filter(f => f.show);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      {/* ===== Hero Banner ===== */}
      {heroSrc ? (
        <div className="relative w-full">
          <div className="relative h-36 w-full overflow-hidden bg-gray-100 sm:h-48 md:h-60 lg:h-72">
            <div className="absolute inset-0">
              <ResponsiveHeroCover
                src={heroSrc}
                alt={`${companyName} banner`}
                priority
                imageClassName="object-cover object-center max-sm:object-[center_25%]"
              />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 bg-gradient-to-b from-black/60 via-black/25 to-transparent" aria-hidden />

            <div className="absolute inset-x-0 top-0 z-10 px-4 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
              <Link
                href="/jobs"
                className=" btn "
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`mx-auto max-w-6xl px-4 md:px-6 ${heroSrc ? "pb-10 pt-8 lg:pb-14 lg:pt-10" : "py-10 lg:py-14"}`}
      >
        {/* ===== Breadcrumb ===== */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/jobs" className="hover:text-red-600 transition-colors">Jobs</Link>
          <span>/</span>
          <span className="max-w-[200px] truncate font-medium text-gray-900">{job.title}</span>
        </nav>

        {/* ===== Main Card Wrapper ===== */}
        <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_minmax(300px,360px)]">
            
            {/* ===== LEFT: Job Content ===== */}
            <article className="min-w-0 p-6 sm:p-8 lg:p-10">
              
              {/* Back Button (non-hero version) */}
              {!heroSrc && (
                <Link
                  href="/jobs"
                  className=" px-4 py-2 text-sm font-medium btn mb-7 md:mb-8 lg:mb-10 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Jobs
                </Link>
              )}

              {/* ===== Title Block ===== */}
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {logoSrc ? (
                  <div className="shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <img
                      src={logoSrc}
                      alt={`${companyName} logo`}
                      className="h-16 w-16 object-contain p-2 sm:h-20 sm:w-20"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-slate-50 sm:h-20 sm:w-20">
                    <Building2 className="h-8 w-8 text-gray-300" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
                      {job.title}
                    </h1>
                    {job.featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-100">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                    {company?.slug ? (
                      <Link
                        href={`/companies/${encodeURIComponent(company.slug)}`}
                        className="font-bold text-red-600 hover:underline"
                      >
                        {companyName}
                      </Link>
                    ) : (
                      <span className="font-bold text-gray-700">{companyName}</span>
                    )}
                    <span className="hidden text-gray-300 sm:block">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location?.trim() || "Location TBD"}
                    </span>
                    {empType && (
                      <>
                        <span className="hidden text-gray-300 sm:block">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {empType}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== Quick Facts Bar ===== */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3">
                {quickFacts.map((fact, i) => {
                  const Icon = fact.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-slate-50/60 px-4 py-3 transition-all hover:border-red-100 hover:bg-red-50/20"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        <Icon className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{fact.label}</p>
                        <p className="truncate text-sm font-semibold text-gray-900">{fact.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ===== Description & Requirements ===== */}
              <div className="mt-10 space-y-8">
                <section>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-100" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Description</h2>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-slate-50/40 p-5 sm:p-6 prose prose-slate prose-sm max-w-none prose-headings:font-semibold">
                    <JobRichBody html={job.description} />
                  </div>
                </section>

                {job.requirements ? (
                  <section>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-gray-100" />
                      <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Requirements</h2>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-slate-50/40 p-5 sm:p-6 prose prose-slate prose-sm max-w-none prose-headings:font-semibold">
                      <JobRichBody html={job.requirements} />
                    </div>
                  </section>
                ) : null}


              </div>
            </article>

            {/* ===== RIGHT: Sidebar ===== */}
<aside className="sticky top-0 self-start mt-2 h-fit border-t border-gray-100  p-6 sm:p-8 lg:border-l lg:border-t-0">
              <JobApplySidebar
                jobId={job.id}
                jobTitle={job.title}
                companyName={companyName}
                jobSlug={job.slug}
                roleDetails={{
                  jobCategory: job.jobCategory,
                  employmentType: job.employmentType,
                  jobLevel: job.jobLevel,
                  location: job.location,
                }}
              />
            </aside>
          </div>
        </div>

        {/* ===== Footer Meta ===== */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400">
          <span>Job ID: {job.id.slice(-8).toUpperCase()}</span>
          <span>·</span>
          <span>Posted recently</span>
        </div>
      </div>
    </div>
  );
}

