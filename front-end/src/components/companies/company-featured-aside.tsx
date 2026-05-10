import Link from "next/link";
import { Star, Calendar, ArrowRight } from "lucide-react";
import { blogCoverSrc } from "@/lib/blog-cover-image";
import type { PublicCompany } from "@/lib/api/types";

function formatDateShort(iso: string | null | undefined): string {
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

type CompanyFeaturedAsideProps = {
  companies: PublicCompany[];
  /** Hide the open company on detail pages. */
  excludeSlug?: string;
  className?: string;
};

export function CompanyFeaturedAside({
  companies,
  excludeSlug,
  className = "",
}: CompanyFeaturedAsideProps) {
  const ex = excludeSlug?.trim().toLowerCase();
  const rows = companies
    .filter((c) => !ex || c.slug.trim().toLowerCase() !== ex)
    .slice(0, 10);

  return (
    <aside className={`min-w-0 ${className}`}>
      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Featured</h2>
        </div>
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-6">
          Top Industry Leaders
        </p>

        {rows.length === 0 ? (
          <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200">
             <p className="text-sm text-slate-400">No featured listings.</p>
          </div>
        ) : (
          <ul className="list-none space-y-3 p-0">
            {rows.map((c) => {
              const logo = blogCoverSrc(c.logoUrl);
              const letter = c.name.trim().slice(0, 1).toUpperCase() || "?";
              const created = c.createdAt;
              
              return (
                <li key={c.id}>
                  <Link
                    href={`/companies/${encodeURIComponent(c.slug)}`}
                    className="group flex items-center gap-4 rounded-2xl border border-transparent p-2 transition-all duration-300 hover:bg-slate-50 hover:border-slate-100"
                  >
                    {/* Compact Logo Style */}
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100 transition-transform group-hover:scale-105">
                      {logo ? (
                        <img
                          src={logo}
                          alt=""
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <span className="text-lg font-black text-slate-300">{letter}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight text-amber-600 border border-amber-100">
                          Featured
                        </span>
                      </div>
                      
                      <p className="truncate text-sm font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                        {c.name}
                      </p>

                      {created && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {formatDateShort(created)}
                        </div>
                      )}
                    </div>

                    <div className="opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 pr-1">
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 pt-6 border-t border-slate-50">
            <button className="w-full text-center text-xs font-bold text-slate-400 hover:text-red-600 transition-colors uppercase tracking-widest">
                Partner with us
            </button>
        </div>
      </div>
    </aside>
  );
}