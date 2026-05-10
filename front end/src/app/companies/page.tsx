import Link from "next/link";
import { ArrowLeft, Building2, Star, ChevronRight, Search, X, Briefcase, Filter } from "lucide-react";
import { CompanyCard } from "@/components/companies/company-card";
import { CompanyFeaturedAside } from "@/components/companies/company-featured-aside";
import { PublicPagination } from "@/components/public/public-pagination";
import {
  emptyPaginated,
  getPublicCompanies,
  getPublicFeaturedCompanies,
} from "@/lib/api/public-api";
import type { PublicCompany } from "@/lib/api/types";

const PAGE_SIZE = 18;

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function CompanyListingsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  let companiesRes = emptyPaginated<PublicCompany>(page, PAGE_SIZE);
  let featuredRes = emptyPaginated<PublicCompany>(1, 10);
  let error: string | null = null;
  
  try {
    const [list, feat] = await Promise.all([
      getPublicCompanies(page, PAGE_SIZE),
      getPublicFeaturedCompanies(1, 10).catch(() =>
        emptyPaginated<PublicCompany>(1, 10),
      ),
    ]);
    companiesRes = list;
    featuredRes = feat;
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load companies.";
  }

  const { items: companies, meta: listMeta } = companiesRes;
  const { items: featured } = featuredRes;

  const hrefPage = (p: number) =>
    `/companies?${new URLSearchParams({ page: String(p) }).toString()}`;

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* --- Modern Red Hero Header --- */}
      <section className="bg-red-600 relative overflow-hidden pt-6 pb-6">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 opacity-10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <svg className="h-full w-full" width="100%" height="80%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-500 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-600 rounded-full blur-3xl opacity-50"></div>
        
        <div className="container mx-auto max-w-7xl px-6 relative z-20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-red-100 text-sm font-medium mb-6 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-white animate-pulse"></span>
                Partnered with {listMeta.totalItems}+ healthcare organizations
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
                Discover Your Next <br />
                <span className="text-red-200">Career Move</span>
              </h1>
              <p className="text-red-100 text-lg md:text-xl font-medium opacity-90 max-w-lg leading-relaxed">
                Connect with industry leaders and verified organizations looking for talent like you.
              </p>
            </div>

            <div className="hidden lg:block">
               <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl shadow-2xl flex flex-col items-center text-center w-60">
                    <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-lg mb-4">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div className="text-white">
                        <div className="text-2xl font-bold">{listMeta.totalItems}</div>
                        <div className="text-sm uppercase tracking-widest font-bold opacity-70">Healthcare facilities</div>
                    </div>
               </div>
            </div>
          </div>
        </div>
      </section>

     

      {/* --- Main Content --- */}
      <div className="container mx-auto max-w-7xl px-6 pt-12 pb-24 relative z-30">
        <div className="grid lg:grid-cols-[1fr_340px] gap-10">
          
          <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-red-600" />
                    Healthcare listings
                </h2>
                <div className="text-sm text-slate-500 font-medium">
                    Showing {companies.length} of {listMeta.totalItems} facilities
                </div>
            </div>

            {error ? (
              <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-8 flex items-center gap-4 text-red-700">
                <div className="bg-red-100 p-3 rounded-full">
                    <X className="w-6 h-6" />
                </div>
                <div>
                    <p className="font-bold">Database Connection Error</p>
                    <p className="text-sm opacity-80">{error}</p>
                </div>
              </div>
            ) : null}

            {companies.length === 0 && !error ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 p-20 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No results found</h3>
                <p className="text-slate-500 max-w-xs mx-auto">We couldn&apos;t find any healthcare organizations matching your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {companies.map((c) => (
                  <div key={c.id} className="transition-transform duration-300 hover:-translate-y-1">
                    <CompanyCard {...c} />
                  </div>
                ))}
              </div>
            )}

            {listMeta.totalPages > 1 && (
              <div className="mt-12 pt-8 border-t border-slate-200">
                <PublicPagination meta={listMeta} hrefForPage={hrefPage} />
              </div>
            )}
          </div>

          {/* --- Sidebar --- */}
          <aside>
            <div className="sticky top-24 space-y-6">
                
                <div className="p-2">
                    <CompanyFeaturedAside companies={featured} />
                
              </div>

              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                      <Building2 className="w-24 h-24" />
                  </div>
                  <p className="text-xs font-bold text-red-200 uppercase tracking-[0.2em] mb-2">For Recruiters</p>
                  <h4 className="text-xl font-bold mb-4">List your company on our platform</h4>
                  <p className="text-red-100 text-sm leading-relaxed mb-6 opacity-90">
                      Get access to premium talent and boost your brand visibility to thousands of job seekers.
                  </p>
                 
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}