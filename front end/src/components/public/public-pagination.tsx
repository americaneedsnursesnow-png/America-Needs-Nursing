import Link from "next/link";

import type { PaginatedMeta } from "@/lib/api/types";

type PublicPaginationProps = {
  meta: PaginatedMeta;
  /** Build URL for a 1-based page index (include pathname + all fixed query keys). */
  hrefForPage: (page: number) => string;
  className?: string;
};

export function PublicPagination({
  meta,
  hrefForPage,
  className = "",
}: PublicPaginationProps) {
  if (meta.totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className={`mt-10 flex flex-wrap items-center justify-center gap-3 ${className}`}
      aria-label="Pagination"
    >
      {meta.hasPreviousPage ? (
        <Link
          href={hrefForPage(meta.page - 1)}
          className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-[var(--color-button)] hover:text-[var(--color-button)]"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-full border border-transparent px-5 py-2 text-sm font-semibold text-gray-400">
          Previous
        </span>
      )}
      <span className="text-sm text-gray-600">
        Page {meta.page} of {meta.totalPages}
        <span className="ml-2 text-gray-400">({meta.totalItems} total)</span>
      </span>
      {meta.hasNextPage ? (
        <Link
          href={hrefForPage(meta.page + 1)}
          className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-[var(--color-button)] hover:text-[var(--color-button)]"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-full border border-transparent px-5 py-2 text-sm font-semibold text-gray-400">
          Next
        </span>
      )}
    </nav>
  );
}
