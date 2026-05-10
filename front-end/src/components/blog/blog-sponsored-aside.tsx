import Link from "next/link";

import { blogCoverSrc } from "@/lib/blog-cover-image";
import type { PublicBlogPost } from "@/lib/api/types";

function formatDateShort(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function newestFirstTimestamp(p: PublicBlogPost): number {
  const created = p.createdAt?.trim();
  if (created) {
    const t = new Date(created).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const pub = p.publishedAt?.trim();
  if (pub) {
    const t = new Date(pub).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

export function topSponsoredPosts(
  posts: PublicBlogPost[],
  limit: number,
  excludeSlug?: string,
): PublicBlogPost[] {
  const ex = excludeSlug?.trim().toLowerCase();
  return posts
    .filter(
      (p) =>
        p.sponsored && (!ex || p.slug.trim().toLowerCase() !== ex),
    )
    .sort((a, b) => newestFirstTimestamp(b) - newestFirstTimestamp(a))
    .slice(0, limit);
}

type BlogSponsoredAsideProps = {
  posts: PublicBlogPost[];
  /** Omit the open article from the list on post detail pages. */
  excludeSlug?: string;
  className?: string;
};

export function BlogSponsoredAside({
  posts,
  excludeSlug,
  className = "",
}: BlogSponsoredAsideProps) {
  const sponsoredTop = topSponsoredPosts(posts, 10, excludeSlug);

  return (
    <aside
      className={`min-w-0 lg:sticky lg:top-24 lg:self-start ${className}`}
    >
      {/* Container: White bg, Red border, No shadow */}
      <div className="border-2 border-red-600 bg-white p-5">
        <h2 className="text-xl font-black uppercase tracking-tighter text-red-600">
          Top blogs
        </h2>
        <p className="mt-1 text-xs font-bold uppercase text-red-600">
          Sponsored picks — up to 10.
        </p>

        {sponsoredTop.length === 0 ? (
          <p className="mt-6 border-t border-red-600 pt-4 text-sm font-bold text-red-600">
            No sponsored posts right now.
          </p>
        ) : (
          <ul className="mt-6 list-none space-y-2 p-0">
            {sponsoredTop.map((post) => {
              const cover = blogCoverSrc(post.coverImageUrl);
              return (
                <li key={post.id}>
                  <Link
                    href={`/blog/${encodeURIComponent(post.slug)}`}
                    className="group flex gap-3 border border-red-600 bg-white p-2 transition-colors hover:bg-red-600"
                  >
                    {/* Image Area */}
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden border border-red-600 bg-white">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt=""
                          className="h-full w-full object-cover grayscale"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg font-black text-red-600 group-hover:text-white">
                          {post.title.slice(0, 1)}
                        </span>
                      )}
                    </div>

                    {/* Text Content */}
                    <div className="min-w-0 flex-1 py-0.5">
                      <span className="mb-1 inline-block border border-red-600 bg-red-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white group-hover:bg-white group-hover:text-red-600">
                        Sponsored
                      </span>
                      <p className="line-clamp-2 text-sm font-black leading-tight text-red-600 group-hover:text-white">
                        {post.title}
                      </p>
                      {post.publishedAt ? (
                        <p className="mt-1 text-[10px] font-bold text-red-600 group-hover:text-white">
                          {formatDateShort(post.publishedAt)}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}