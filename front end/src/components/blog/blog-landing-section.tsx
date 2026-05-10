

// components/blog/blog-landing-section.tsx
import Link from "next/link";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { ArrowRight, Sparkles } from "lucide-react";
import { blogCoverSrc } from "@/lib/blog-cover-image";
import { getPublicBlogPostsCached } from "@/lib/api/public-data-cache";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  });
}

export async function BlogLandingSection() {
  let posts: Awaited<ReturnType<typeof getPublicBlogPostsCached>>["items"] = [];
  try {
    const data = await getPublicBlogPostsCached(1, 10);
    posts = data.items;
  } catch {
    return null;
  }

  if (posts.length === 0) return null;

  // Slicing for the 3-column layout
  const centerFeatured = posts[0];          // The Big Hero (Center)
  const leftColumnPosts = posts.slice(1, 4); // 3 Posts for Left
  const rightColumnPosts = posts.slice(4, 8); // 4 Posts for Right

  return (
    <section className="py-16 md:py-20 bg-slate-50">
      <SiteContentWrapper>
        
        {/* --- Section Header --- */}
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-red-600 mb-2">
                <Sparkles size={18} fill="currentColor" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">The Front Page</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-red-600">
                Latest Blogs
            </h2>
          </div>
          <Link 
            href="/blog" 
            className="btn gap-2  transition-all"
          >
            EXPLORE ALL ARTICLES <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* --- 3-Column Magazine Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          
          {/* 1. LEFT COLUMN (3 Posts) */}
          <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Trending</h3>
            {leftColumnPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                <div className="aspect-[16/10] overflow-hidden rounded-xl bg-slate-200 mb-3">
                  <img 
                    src={blogCoverSrc(post.coverImageUrl) || ""} 
                    alt="" 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                </div>
                <p className="text-[10px] font-bold text-red-600 uppercase mb-1">{formatDate(post.publishedAt)}</p>
                <h4 className="font-bold leading-tight text-slate-800 group-hover:text-red-600 line-clamp-2 transition-colors">
                  {post.title}
                </h4>
              </Link>
            ))}
          </div>

          {/* 2. CENTER COLUMN (Main Hero) */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <Link href={`/blog/${centerFeatured.slug}`} className="group block text-center">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-slate-100 mb-8 shadow-2xl shadow-slate-200">
                <img 
                  src={blogCoverSrc(centerFeatured.coverImageUrl) || ""} 
                  alt="" 
                  className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="px-2">
                <span className="inline-block bg-red-50 text-red-600 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest mb-4">
                  Feature Story
                </span>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-black leading-[0.95] tracking-tighter text-slate-900 group-hover:text-red-600 transition-colors">
                  {centerFeatured.title}
                </h3>
                <p className="mt-4 text-lg text-slate-500 line-clamp-3 italic max-w-xl mx-auto font-medium">
                  "{centerFeatured.excerpt || centerFeatured.body.slice(0, 160)}..."
                </p>
              </div>
            </Link>
          </div>

          {/* 3. RIGHT COLUMN (4 Posts) */}
          <div className="lg:col-span-3 space-y-6 order-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Top Stories</h3>
            {rightColumnPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group flex gap-6 items-start border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 shadow-sm">
                  <img src={blogCoverSrc(post.coverImageUrl) || ""} alt="" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-bold leading-tight text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase italic">
                    {formatDate(post.publishedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </SiteContentWrapper>
    </section>
  );
}