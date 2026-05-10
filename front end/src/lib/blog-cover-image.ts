/**
 * Normalizes blog `coverImageUrl` from the API for use in `<img src>`.
 * Relative paths (e.g. `/files/blog-images/...`) work with Next `rewrites` to Nest.
 */
export function blogCoverSrc(url: string | null | undefined): string | null {
  if (url === null || url === undefined) return null;
  const t = String(url).trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}
