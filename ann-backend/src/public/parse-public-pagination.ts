import {
  normalizePagination,
  type PaginatedMeta,
  type PaginatedResult,
} from '../common/types/paginated';

export type { PaginatedMeta, PaginatedResult };

/**
 * Parses `page` and `limit` query strings for public list routes.
 * `maxLimit` caps the page size (e.g. featured companies use 50).
 */
export function parsePublicPagination(
  pageRaw: string | undefined,
  limitRaw: string | undefined,
  defaults: { defaultPage?: number; defaultLimit?: number; maxLimit?: number },
): { page: number; limit: number; skip: number } {
  const defaultPage = defaults.defaultPage ?? 1;
  const defaultLimit = defaults.defaultLimit ?? 20;
  const maxLimit = defaults.maxLimit ?? 100;

  const pageParsed = Number.parseInt(String(pageRaw ?? ''), 10);
  const limitParsed = Number.parseInt(String(limitRaw ?? ''), 10);

  const page =
    Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : defaultPage;
  let limit =
    Number.isFinite(limitParsed) && limitParsed > 0
      ? limitParsed
      : defaultLimit;
  limit = Math.min(maxLimit, Math.max(1, limit));

  return normalizePagination(page, limit);
}
