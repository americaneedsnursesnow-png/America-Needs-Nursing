/** Server-only: Nest ann-backend URL for the `/api/nest/[...path]` proxy route. */
export function getApiUpstreamUrl(): string {
  const explicit = process.env.API_UPSTREAM_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const publicApi = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (publicApi && /^https?:\/\//i.test(publicApi)) {
    return publicApi.replace(/\/$/, "");
  }
  return "http://127.0.0.1:3001";
}
