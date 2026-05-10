/**
 * Free job publishing (no active paid package + no subscription) is tracked
 * per company per UTC calendar month: `companies.free_tier_yyyymm` +
 * `companies.free_tier_published_count` vs the tenant’s limit on `clients`
 * (see `ClientsService` / `DEFAULT_FREE_TIER_JOB_POSTS_PER_MONTH`).
 */
export const DEFAULT_FREE_TIER_JOB_POSTS_PER_MONTH = 5;

/**
 * @deprecated Use {@link DEFAULT_FREE_TIER_JOB_POSTS_PER_MONTH}; kept for a stable import name in SQL/error messages.
 */
export const FREE_TIER_JOB_POSTS_PER_UTC_MONTH = DEFAULT_FREE_TIER_JOB_POSTS_PER_MONTH;

export function getUtcYyyyMm(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return `${y}${m.toString().padStart(2, '0')}`;
}
