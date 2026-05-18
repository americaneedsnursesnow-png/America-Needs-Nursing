import Link from "next/link";
import { ArrowRight, ChevronRight, ChevronLeft, Newspaper } from "lucide-react";
import { PublicPagination } from "@/components/public/public-pagination";
import { blogCoverSrc } from "@/lib/blog-cover-image";
import { plainTextPreviewFromHtml } from "@/lib/html-plain-text";
import { BlogSponsoredChip } from "@/components/blog/blog-sponsored-chip";
import { emptyPaginated, getPublicBlogPosts } from "@/lib/api/public-api";
import type { PublicBlogPost } from "@/lib/api/types";

const PAGE_SIZE = 12;

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function BlogListPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  let data = emptyPaginated<PublicBlogPost>(page, PAGE_SIZE);
  let error: string | null = null;

  try {
    data = await getPublicBlogPosts(page, PAGE_SIZE);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load posts.";
  }

  const posts = data.items;

  // --- Dynamic Layout Distribution ---
  const mainFeature = posts[0];
  const leftSidebar = posts.slice(1, 4);   // "Trending"
  const rightSidebar = posts.slice(4, 9);  // "Just In"
  const bottomFeature = posts[9];          // Wide Banner
  const bottomList = posts.slice(10, 13);  // "Latest Headlines"

  const mainCover = mainFeature ? blogCoverSrc(mainFeature.coverImageUrl) : null;
  const bottomCover = bottomFeature ? blogCoverSrc(bottomFeature.coverImageUrl) : null;

  const hrefPage = (p: number) =>
    `/blog?${new URLSearchParams({ page: String(p) }).toString()}`;

  if (posts.length === 0 && !error) {
    return (
      <div className="py-40 text-center">
        <Newspaper className="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-2xl font-serif text-slate-500 italic">The archives are currently empty.</h2>
        <Link href="/blog" className="text-red-600 font-bold underline mt-4 inline-block">Refresh Feed</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#fdfdfd] font-sans text-slate-900 selection:bg-red-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        
        {/* --- Magazine Masthead --- */}
        <header className="mb-12 border-b-[6px] border-double border-slate-900 pb-8 text-center">
            <h1 className="text-4xl md:text-4xl font-black text-slate-900  uppercase  mb-2">
                The Nurse <span className="text-red-600">Daily</span>
            </h1>
            <div className="flex items-center justify-between border-y border-slate-900 py-2 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mt-2">
                <span>Volume {new Date().getFullYear()} • No. {page}</span>
                <span className="hidden md:block">Health Care & Clinical Excellence</span>
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
        </header>

        {error && (
          <div className="mb-10 bg-red-50 border-l-4 border-red-600 p-4 text-red-800 text-sm font-medium">
            Error: {error}
          </div>
        )}

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 1. LEFT SIDEBAR (Conditional) */}
          {leftSidebar.length > 0 && (
            <aside className="lg:col-span-3 space-y-8 lg:border-r lg:border-slate-200 lg:pr-8">
              <h2 className="text-xs font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-1 inline-block mb-4">Trending</h2>
              {leftSidebar.map((post) => {
                const cover = blogCoverSrc(post.coverImageUrl);
                return (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group block border-b border-slate-100 pb-6 last:border-0">
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100 mb-3  group-hover:grayscale-0 transition-all duration-500">
                      {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      ) : null}
                  </div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight">{formatDate(post.publishedAt)}</p>
                    {post.sponsored ? <BlogSponsoredChip /> : null}
                  </div>
                  <h3 className="text-base font-bold leading-tight group-hover:text-red-600 underline-offset-2 decoration-2">{post.title}</h3>
                </Link>
              );
              })}
            </aside>
          )}

          {/* 2. CENTER HERO (Adaptive Width) */}
          <main className={`
            ${leftSidebar.length > 0 && rightSidebar.length > 0 ? "lg:col-span-6" : ""}
            ${leftSidebar.length > 0 && rightSidebar.length === 0 ? "lg:col-span-9" : ""}
            ${leftSidebar.length === 0 && rightSidebar.length > 0 ? "lg:col-span-9" : ""}
            ${leftSidebar.length === 0 && rightSidebar.length === 0 ? "lg:col-span-12" : ""}
          `}>
            {mainFeature && (
              <Link href={`/blog/${mainFeature.slug}`} className="group block">
                <div className="relative aspect-video w-full overflow-hidden mb-6 bg-slate-100 sm:aspect-[4/3]">
                    {mainCover ? (
                      <img
                        src={mainCover}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                    ) : null}
                    <div className="absolute top-0 right-0 bg-red-600 text-white p-4 text-xs font-black uppercase tracking-[0.3em] [writing-mode:vertical-lr]">
                        Feature Story
                    </div>
                </div>
                <div className="text-center md:px-6">
                    {mainFeature.sponsored ? (
                      <div className="mb-4 flex justify-center">
                        <BlogSponsoredChip className="px-2 py-1 text-[10px]" />
                      </div>
                    ) : null}
                    <h2 className="text-4xl md:text-6xl font-black text-red-600 tracking-tighter leading-[0.9] mb-6 group-hover:text-red-600 transition-colors">
                        {mainFeature.title}
                    </h2>
                    <p className="text-xl text-slate-600 leading-relaxed font-serif italic first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:float-left">
                        {plainTextPreviewFromHtml(
                          mainFeature.excerpt || mainFeature.body,
                          200,
                        )}
                    </p>
                    <div className="mt-8 flex justify-center">
                        <span className="border-y-2 border-slate-900 py-2 px-8 text-sm font-black uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            Read Continued Article
                        </span>
                    </div>
                </div>
              </Link>
            )}
          </main>

          {/* 3. RIGHT SIDEBAR (Conditional) */}
          {rightSidebar.length > 0 && (
            <aside className="lg:col-span-3 space-y-6 lg:border-l lg:border-slate-200 lg:pl-8">
              <h2 className="text-xs font-black uppercase tracking-widest border-b-2 border-slate-900 w-full pb-1 mb-4">Just In</h2>
              {rightSidebar.map((post) => {
                const cover = blogCoverSrc(post.coverImageUrl);
                return (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group flex gap-3 items-start border-b border-slate-50 pb-4">
                  <div className="h-16 w-16 shrink-0 bg-slate-100 overflow-hidden">
                      {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover grayscale opacity-80" />
                      ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                      {post.sponsored ? (
                        <div className="mb-1">
                          <BlogSponsoredChip className="scale-90 origin-left" />
                        </div>
                      ) : null}
                      <h3 className="text-xs font-bold leading-tight group-hover:text-red-600 group-hover:underline">{post.title}</h3>
                      <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{formatDate(post.publishedAt)}</p>
                  </div>
                </Link>
              );
              })}
            </aside>
          )}
        </div>

        {/* --- BOTTOM FEATURE SECTION (Only if enough posts) --- */}
        {bottomFeature && (
          <section className="mt-20 pt-12 border-t-4 border-slate-900">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8">
                      <Link href={`/blog/${bottomFeature.slug}`} className="group relative block overflow-hidden bg-slate-900">
                          <div className="flex flex-col md:flex-row items-stretch">
                              <div className="w-full md:w-1/2 aspect-video overflow-hidden bg-slate-800">
                                  {bottomCover ? (
                                    <img
                                      src={bottomCover}
                                      alt=""
                                      className="h-full w-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                    />
                                  ) : null}
                              </div>
                              <div className="p-10 md:w-1/2 flex flex-col justify-center text-white">
                                  <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <span className="text-red-500 text-[10px] font-black tracking-[0.3em] uppercase">Special Report</span>
                                    {bottomFeature.sponsored ? <BlogSponsoredChip /> : null}
                                  </div>
                                  <h3 className="text-3xl font-black leading-[1.1] mb-6">{bottomFeature.title}</h3>
                                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                                      View Report <ArrowRight size={16} />
                                  </div>
                              </div>
                          </div>
                      </Link>
                  </div>

                  {/* BOTTOM LIST */}
                  <div className="lg:col-span-4">
                      <div className="h-full border-2 border-slate-100 p-6 flex flex-col">
                          <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-600" /> Headlines
                          </h2>
                          <div className="space-y-8 flex-1">
                              {bottomList.length > 0 ? bottomList.map(post => (
                                  <Link key={post.id} href={`/blog/${post.slug}`} className="block group border-l-2 border-transparent hover:border-red-600 pl-4 transition-all">
                                      <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <p className="text-[10px] font-bold text-red-600">{formatDate(post.publishedAt)}</p>
                                        {post.sponsored ? <BlogSponsoredChip className="scale-90" /> : null}
                                      </div>
                                      <h4 className="font-bold text-sm leading-snug group-hover:text-red-600">{post.title}</h4>
                                  </Link>
                              )) : (
                                <p className="text-xs text-slate-400 italic">No further headlines today.</p>
                              )}
                          </div>
                          <Link href="/blog" className="mt-8 block text-center bg-slate-900 text-white py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">
                              View All Records
                          </Link>
                      </div>
                  </div>
              </div>
          </section>
        )}

        {/* --- MAGAZINE PAGINATION --- */}
        {(data.meta.totalItems > PAGE_SIZE || page > 1) && (
          <nav className="mt-20 flex flex-col items-center gap-8 border-t border-slate-200 pt-12">
              <div className="flex items-center gap-4">
                <div className="h-px w-12 bg-slate-200" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    Catalogue Page {page} of {Math.ceil(data.meta.totalItems / PAGE_SIZE)}
                </span>
                <div className="h-px w-12 bg-slate-200" />
              </div>
              
              <div className="flex items-center gap-2">
                  <Link 
                    href={hrefPage(page - 1)}
                    className={`flex items-center gap-2 px-6 py-3 border-2 border-slate-900 text-xs font-black uppercase tracking-widest transition-all ${page <= 1 ? "pointer-events-none opacity-20" : "hover:bg-slate-900 hover:text-white"}`}
                  >
                    <ChevronLeft size={16} /> Previous
                  </Link>
                  
                  <Link 
                    href={hrefPage(page + 1)}
                    className={`flex items-center gap-2 px-6 py-3 border-2 border-slate-900 text-xs font-black uppercase tracking-widest transition-all ${posts.length < PAGE_SIZE ? "pointer-events-none opacity-20" : "hover:bg-slate-900 hover:text-white"}`}
                  >
                    Next Issue <ChevronRight size={16} />
                  </Link>
              </div>
              
              {/* This is your standard pagination component for jumping to numbers */}
              <div className="mt-4 opacity-50 hover:opacity-100 transition-opacity">
                <PublicPagination meta={data.meta} hrefForPage={hrefPage} />
              </div>
          </nav>
        )}
      </div>
    </div>
  );
}