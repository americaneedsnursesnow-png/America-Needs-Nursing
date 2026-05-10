export type PaginatedMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  meta: PaginatedMeta;
};

export function buildPaginatedMeta(
  totalItems: number,
  page: number,
  limit: number,
): PaginatedMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    page: safePage,
    limit,
    totalItems,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}

export function normalizePagination(
  page: number,
  limit: number,
): {
  page: number;
  limit: number;
  skip: number;
} {
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const safePage = Math.max(1, Math.floor(page));
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}
