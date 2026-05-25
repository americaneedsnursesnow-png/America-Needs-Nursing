import Link from "next/link";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { blogCoverSrc } from "@/lib/blog-cover-image";
import { getPublicBlogPosts } from "@/lib/api/public-api";
import type { PublicBlogPost } from "@/lib/api/types";
import { htmlToPlainText } from "@/lib/html-to-plain-text";
import { ArrowRight } from "lucide-react";

function formatDate(iso: string | null): string {
  if (!iso) return "News";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "News";
  }
}

export async function BlogSection() {
  let posts: PublicBlogPost[] = [];
  try {
    const { items } = await getPublicBlogPosts(1, 12);
    posts = items.slice(0, 6);
  } catch {
    posts = [];
  }

  return (
    <div className="w-full bg-white">
      <section className="w-full py-20">
        <SiteContentWrapper>
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Latest <span style={{ color: "var(--color-button)" }}>Blog</span>{" "}
            & News
          </h2>
          <div
            className="mx-auto h-1.5 w-16 rounded-full"
            style={{ backgroundColor: "var(--color-button)" }}
          />
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-gray-600">
            No blog posts yet. Publish posts in the admin blog API to see them
            here.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const preview = htmlToPlainText(post.excerpt || post.body);
              return (
                <div
                  key={post.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-500 hover:shadow-2xl"
                >
                <div
                  className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200"
                  aria-hidden
                >
                  {blogCoverSrc(post.coverImageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={blogCoverSrc(post.coverImageUrl) ?? ""}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-black text-slate-300">
                      {post.title.slice(0, 1)}
                    </span>
                  )}
                  <div
                    className="absolute left-4 top-4 z-10 rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg"
                    style={{ backgroundColor: "var(--color-button)" }}
                  >
                    {formatDate(post.publishedAt)}
                  </div>
                </div>

                <div className="flex flex-grow flex-col p-7">
                  <h3 className="mb-3 line-clamp-2 text-xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-[var(--color-button)]">
                    {post.title}
                  </h3>
                  <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-gray-500">
                    {preview.slice(0, 160)}
                    {preview.length > 160 ? "…" : ""}
                  </p>

                  <div className="mt-auto">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group/btn flex w-full items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-black transition-all duration-300 hover:border-[var(--color-button)] hover:bg-[var(--color-button)] hover:text-white hover:opacity-90"
                    >
                      Continue Reading
                      <span className="transition-transform duration-300 group-hover/btn:translate-x-2">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link 
                href="/blog" 
                className="btn inline-flex items-center gap-2 !py-2 !px-4 text-sm shadow-md"             >
                 Explore All Blogs
               <ArrowRight className="w-4 h-4 transition-transform group-hover:-translate-x-1" />

              </Link>
        </div>
        </SiteContentWrapper>
      </section>
    </div>
  );
}
