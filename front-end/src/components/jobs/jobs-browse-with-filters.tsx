"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Briefcase,
  Layers,
  Clock,
  MapPin,
  ChevronRight,
  DollarSign,
  Stethoscope,
} from "lucide-react";

import { PublicPagination } from "@/components/public/public-pagination";
import type { JobBrowseFilters } from "@/lib/job-browse-search-params";
import { buildJobBrowseSearchParams, emptyJobBrowseFilters, parseJobBrowseFilters } from "@/lib/job-browse-search-params";
import type { JobMapMarker } from "@/lib/api/public-api";
import type { PaginatedMeta, PublicJob } from "@/lib/api/types";
import { heroContent } from "@/features/hero/content";
import {
  JOB_BROWSE_SALARY_OPTIONS,
  JOB_TITLE_FILTER_OPTIONS,
  jobListingMetaLine,
  jobRoleDetailEntries,
  jobTitleFilterMatches,
} from "@/lib/job-posting-metadata";
import { blogCoverSrc } from "@/lib/blog-cover-image";
import { US_STATES, usStateByCode } from "@/lib/us-states";



type JobsBrowseWithFiltersProps = {
  jobs: PublicJob[];
  error: string | null;
  meta: PaginatedMeta;
  initialFilters: JobBrowseFilters;
  mapMarkers: JobMapMarker[];
};

/** --- Helper Logic (Unchanged) --- **/
function normalize(s: string): string { return s.trim().toLowerCase(); }

function jobMatchesExperience(job: PublicJob, exp: string): boolean {
  if (!exp) return true;
  const n = parseInt(exp, 10);
  if (!Number.isFinite(n) || n <= 0) return true;
  const blob = `${job.description ?? ""}\n${job.requirements ?? ""}`.toLowerCase();
  if (!/(yr|year|yrs|experience)/i.test(blob)) return true;
  if (n >= 5) return /\b(5|6|7|8|9|10)\+?\s*(yr|year|yrs|years)\b/.test(blob) || /\b5\+\s*(yr|year|yrs)/.test(blob);
  const re = new RegExp(`\\b(${n}|${n}\\+)\\s*(yr|year|yrs|years)\\b`, "i");
  return re.test(blob) || blob.includes(`${n}+ year`);
}

function jobMatchesState(job: PublicJob, stateCode: string): boolean {
  const code = stateCode.trim().toUpperCase();
  if (!code) return true;
  if (job.stateCode?.trim().toUpperCase() === code) return true;
  const meta = usStateByCode(code);
  const loc = job.location?.toLowerCase() ?? "";
  if (meta && loc.includes(meta.name.toLowerCase())) return true;
  return loc.includes(code.toLowerCase());
}

/** --- Sub-component for Modern Sidebar Sections --- **/
const FilterSection = ({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-4 last:border-0">
      <button onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between text-left group">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isOpen ? 'text-red-600' : 'text-gray-400'}`} />
          <span className="text-sm font-bold text-gray-700 group-hover:text-red-600 transition-colors uppercase tracking-wider">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
  );
};

export function JobsBrowseWithFilters({
  jobs,
  error,
  meta,
  initialFilters,
  mapMarkers,
}: JobsBrowseWithFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const spKey = sp.toString();
  const [filters, setFilters] = useState<JobBrowseFilters>(initialFilters);

  useEffect(() => {
    const o: Record<string, string> = {};
    new URLSearchParams(spKey).forEach((v, k) => { o[k] = v; });
    setFilters(parseJobBrowseFilters(o));
  }, [spKey]);

  const pushUrl = useCallback((next: JobBrowseFilters, page: number) => {
    router.replace(`/jobs${buildJobBrowseSearchParams(next, page)}`, { scroll: false });
  }, [router]);

  const filtered = useMemo(() => {
    const q = normalize(filters.q);
    const cat = normalize(filters.category);
    const salary = filters.salary.trim();
    const jt = filters.jobTitle.trim();
    return jobs.filter((job) => {
      if (salary && (job.expectedSalaryRange ?? "") !== salary) return false;
      if (!jobTitleFilterMatches(job.title, jt)) return false;
      if (!jobMatchesState(job, filters.state)) return false;
      if (cat) {
        const jc = normalize(job.jobCategory ?? "");
        if (!jc.includes(cat) && !normalize(job.title).includes(cat)) return false;
      }
      if (!jobMatchesExperience(job, filters.experience)) return false;
      if (!q) return true;
      const hay = [job.title, job.company?.name ?? "", job.jobCategory ?? "", job.location ?? "", job.description ?? ""].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [jobs, filters]);

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const clearFilters = () => {
    const cleared = emptyJobBrowseFilters();
    setFilters(cleared);
    pushUrl(cleared, 1);
  };
  const experienceOptions = heroContent.searchCard.selects.experience.options;
  const categoryOptions = heroContent.searchCard.selects.category.options;

  const markersForMap = useMemo(() => {
    const st = filters.state.trim().toUpperCase();
    if (!st) return mapMarkers;
    return mapMarkers.filter(
      (m) => (m.stateCode ?? "").trim().toUpperCase() === st,
    );
  }, [mapMarkers, filters.state]);

  const hrefForPage = (page: number) => `/jobs${buildJobBrowseSearchParams(filters, page)}`;
  const existingCategoryNames = Array.from(
  new Set(jobs.map((job) => job.jobCategory))
).filter(Boolean) as string[]; // filter(Boolean) removes null/empty values

// 2. Format them for the footer (limit to 6)
const footerCategoryLinks = existingCategoryNames
  .slice(0, 6) // Max 6 variables
  .map((catName) => ({
    label: catName,
    href: `/jobs?category=${encodeURIComponent(catName.toLowerCase())}`,
  }));


 return (
  <div className="flex flex-col lg:flex-row gap-8 min-h-screen">
    
    {/* --- Left Sidebar Filter --- */}
    <aside className="w-full lg:w-[320px] shrink-0">
      <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          </div>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear All
            </button>
          )}
        </div>

        <div className="space-y-8">
          {/* Search Input - Kept as text input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => {
                const next = { ...filters, q: e.target.value };
                setFilters(next);
                pushUrl(next, 1);
              }}
              placeholder="Search keywords..."
              className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
            />
          </div>

          {/* Categories - Open List */}
          <FilterSection title="Categories" icon={Layers}>
            <div className="flex flex-col gap-1 mt-2">
              {categoryOptions.map((o) => (
                <button
                  key={o.value || 'all-cat'}
                  onClick={() => { const next = { ...filters, category: o.value }; setFilters(next); pushUrl(next, 1); }}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.category === o.value 
                    ? 'bg-red-50 text-red-700 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Discipline" icon={Stethoscope}>
            <div className="mt-2 flex flex-wrap gap-2">
              {JOB_TITLE_FILTER_OPTIONS.map((o) => (
                <button
                  key={o.value || "all-discipline"}
                  type="button"
                  onClick={() => {
                    const next = { ...filters, jobTitle: o.value };
                    setFilters(next);
                    pushUrl(next, 1);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    filters.jobTitle === o.value
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="State" icon={MapPin} defaultOpen>
            <div className="mt-2 flex max-h-52 flex-col gap-1 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  const next = { ...filters, state: "" };
                  setFilters(next);
                  pushUrl(next, 1);
                }}
                className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  !filters.state.trim()
                    ? "bg-red-50 font-semibold text-red-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                All states
              </button>
              {US_STATES.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => {
                    const next = { ...filters, state: s.code };
                    setFilters(next);
                    pushUrl(next, 1);
                  }}
                  className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    filters.state === s.code
                      ? "bg-red-50 font-semibold text-red-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Salary offering" icon={DollarSign}>
            <div className="mt-2 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  const next = { ...filters, salary: "" };
                  setFilters(next);
                  pushUrl(next, 1);
                }}
                className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  !filters.salary.trim()
                    ? "bg-red-50 font-semibold text-red-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Any salary
              </button>
              {JOB_BROWSE_SALARY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    const next = { ...filters, salary: o.value };
                    setFilters(next);
                    pushUrl(next, 1);
                  }}
                  className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    filters.salary === o.value
                      ? "bg-red-50 font-semibold text-red-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Experience - Open List */}
          <FilterSection title="Experience" icon={Clock}>
            <div className="flex flex-wrap gap-2 mt-2">
              {experienceOptions.map((o) => (
                <button
                  key={o.value || 'all-exp'}
                  onClick={() => { const next = { ...filters, experience: o.value }; setFilters(next); pushUrl(next, 1); }}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    filters.experience === o.value 
                    ? 'border-red-600 bg-red-600 text-white' 
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </FilterSection>

        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
           <div className="p-4 bg-red-50 rounded-xl text-center">
              <p className="text-xs text-red-800 leading-relaxed">
                Found <strong>{filtered.length}</strong> available positions
              </p>
           </div>
        </div>
      </div>
    </aside>

    {/* --- Right Content: job cards from API (filtered client-side) --- */}
    <div className="flex-1 min-w-0">
      

     

      {!error && filtered.length === 0 && (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
          <Briefcase className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-800">
            {jobs.length === 0
              ? "No openings listed yet"
              : "No jobs match your filters"}
          </h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {jobs.length === 0
              ? "Published roles from verified employers will appear here. Check back soon, or try another search later."
              : "Try clearing filters or widening your search. Only published jobs with approved companies are shown."}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          <div className="divide-y divide-gray-100 rounded-3xl border border-gray-100 bg-white shadow-sm">
            {filtered.map((job) => {
              const rows = jobRoleDetailEntries(job);
              const meta =
                rows.length > 0
                  ? rows
                      .slice(0, 2)
                      .map((r) => `${r.label}: ${r.value}`)
                      .join(" · ")
                  : jobListingMetaLine(job) ?? "";
              const logo = job.company?.logoUrl
                ? blogCoverSrc(job.company.logoUrl)
                : null;
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${encodeURIComponent(job.slug)}`}
                  className="group flex flex-col gap-4 p-5 transition-colors hover:bg-red-50/40 sm:flex-row sm:items-center"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                    {logo ? (
                      <img
                        src={logo}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Briefcase className="h-7 w-7 text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-gray-900 group-hover:text-red-600 md:text-xl">
                        {job.title}
                      </h2>
                      {job.featured ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm font-bold text-red-600">
                      {job.company?.name ?? "Employer"}
                    </p>
                    {meta ? (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {meta}
                      </p>
                    ) : null}
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location?.trim() || "Location TBD"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-black uppercase text-red-600">
                      View
                    </span>
                    <ChevronRight className="h-5 w-5 text-red-500 transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>

          {meta.totalPages > 1 && (
            <div className="mt-10">
              <PublicPagination meta={meta} hrefForPage={hrefForPage} />
            </div>
          )}
        </>
      )}
    </div>
  </div>
);
}