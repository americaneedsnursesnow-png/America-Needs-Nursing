/** Server-only: Nest ann-backend URL for the `/api/nest/[...path]` proxy route. */
export function getApiUpstreamUrl(): string {
  return (
    process.env.API_UPSTREAM_URL?.trim() || "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
}
