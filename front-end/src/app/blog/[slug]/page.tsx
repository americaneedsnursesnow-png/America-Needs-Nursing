import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Share2, Clock } from "lucide-react";

import { BlogSponsoredAside } from "@/components/blog/blog-sponsored-aside";
import { JobRichBody } from "@/components/jobs/job-rich-body";
import { blogCoverSrc } from "@/lib/blog-cover-image";
import {
  emptyPaginated,
  getPublicBlogPostBySlug,
  getPublicBlogPosts,
} from "@/lib/api/public-api";
import type { PublicBlogPost } from "@/lib/api/types";

type PageProps = { params: Promise<{ slug: string }> };

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function BlogPostDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let post: Awaited<ReturnType<typeof getPublicBlogPostBySlug>>;
  let allPosts: PublicBlogPost[] = [];
  try {
    const [fetchedPost, fetchedList] = await Promise.all([
      getPublicBlogPostBySlug(slug),
      getPublicBlogPosts(1, 40).catch(() => emptyPaginated<PublicBlogPost>(1, 40)),
    ]);
    post = fetchedPost;
    allPosts = fetchedList.items;
  } catch {
    notFound();
  }

  const coverSrc = blogCoverSrc(post.coverImageUrl);

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-slate-900">
      {/* --- Full Width Hero Banner --- */}
      <div className="relative w-full h-[30vh] md:h-[40vh] lg:h-[50vh] overflow-hidden bg-slate-900">
        {coverSrc ? (
          <>
            <img
              src={coverSrc}
              alt={post.title}
              className="w-full h-full object-cover object-center scale-105 animate-in fade-in zoom-in duration-1000"
            />
            {/* Subtle Overlay for better text readability and depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </>
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
             <span className="text-slate-300 font-serif italic text-6xl">The Daily Nurse</span>
          </div>
        )}

        {/* Floating Top Navigation */}
        <div className="absolute top-0 left-0 w-full z-20 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <Link 
                    href="/blog" 
                    className=" btn transition-all duration-300"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Blogs
                </Link>
            </div>
        </div>

        {/* Hero Content Overlay (Optional Title Integration) */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 text-white">
            <div className="max-w-7xl mx-auto">
                {post.sponsored && (
                    <span className="inline-block px-3 py-1 bg-red-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        Sponsored Content
                    </span>
                )}
                {/* Date and Reading Time */}
                <div className="flex items-center gap-4 text-xs font-medium text-white/80 uppercase tracking-widest mb-1">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(post.publishedAt)}</span>
                    <span className="h-1 w-1 bg-white/40 rounded-full" />
                    <span className="flex items-center gap-1.5"><Clock size={14} /> 5 Min Read</span>
                </div>
            </div>
        </div>
      </div>

      {/* --- Article Body --- */}
      <div className="relative z-10 -mt-9 md:-mt-15 px-4 md:px-6">
        <div className="mx-auto max-w-7xl">
            <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-16 items-start">
                
                <article className="bg-white p-6 md:p-12 shadow-2xl shadow-slate-200/50 rounded-2xl md:rounded-3xl border border-slate-100">
                    <header className="mb-10">
                        <h1 className="text-3xl md:text-3xl lg:text-4xl font-black tracking-tighter leading-[1.1] text-slate-900 mb-6 ">
                            {post.title}
                        </h1>
                        <div className="h-1.5 w-24 bg-red-600" />
                    </header>

                    <div className="prose prose-slate prose-lg max-w-none 
                        prose-headings:font-black prose-headings:tracking-tight prose-headings:font-serif
                        prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-xl
                        prose-img:rounded-2xl prose-blockquote:border-l-4 prose-blockquote:border-red-600 prose-blockquote:bg-slate-50 prose-blockquote:p-6 prose-blockquote:italic
                    ">
                        <JobRichBody
                            html={post.body}
                            variant="blog"
                        />
                    </div>

                    {/* Social Share / Footer */}
                    
                </article>

                {/* Sidebar */}
                <aside className="mt-12 lg:mt-0 sticky top-8">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Related Coverage</h3>
                        <BlogSponsoredAside
                            posts={allPosts}
                            excludeSlug={post.slug}
                            className="space-y-6"
                        />
                        
                       
                    </div>
                </aside>
            </div>
        </div>
      </div>

      {/* --- Footer Spacing --- */}
      <div className="h-20" />
    </div>
  );
}