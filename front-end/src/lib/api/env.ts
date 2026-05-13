/**
 * Base URL for REST (and browser fetch targets). Prefer a single env var:
 * **`NEXT_PUBLIC_API_BASE_URL`** (`http(s)://…`, no trailing slash).
 *
 * - **Browser:** unset → same-origin **`/api/nest`**. Set the public URL to call Nest directly;
 *   Nest **`CORS_ORIGINS`** must include your Next origin.
 * - **Server:** `NEXT_PUBLIC_API_BASE_URL`, else optional **`API_UPSTREAM_URL`** (same URL if you split
 *   server-only vs public), else `http://127.0.0.1:3001`.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const browserDirect = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (browserDirect && /^https?:\/\//i.test(browserDirect)) {
      return browserDirect.replace(/\/$/, "");
    }
    return "/api/nest";
  }
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw && raw.length > 0) {
    return raw.replace(/\/$/, "");
  }
  const internal = process.env.API_UPSTREAM_URL?.trim() || "http://127.0.0.1:3001";
  return internal.replace(/\/$/, "");
}

/**
 * Nest HTTP(S) origin for **browser** Socket.IO (cannot use the Next `/api/nest` proxy).
 * Defaults from **`NEXT_PUBLIC_API_BASE_URL`** when set; override with `NEXT_PUBLIC_SOCKET_ORIGIN`
 * or legacy `NEXT_PUBLIC_NEST_SOCKET_ORIGIN` if the socket host differs.
 */
export function getSocketIoBackendOrigin(): string {
  const primary = process.env.NEXT_PUBLIC_SOCKET_ORIGIN?.trim();
  if (primary) {
    return primary.replace(/\/$/, "");
  }
  const api = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (api && /^https?:\/\//i.test(api)) {
    return api.replace(/\/$/, "");
  }
  const legacy = process.env.NEXT_PUBLIC_NEST_SOCKET_ORIGIN?.trim();
  if (legacy) {
    return legacy.replace(/\/$/, "");
  }
  return "http://localhost:3001";
}

/**
 * Socket.IO for `/community-chat`. Call only from the client (e.g. `useEffect`).
 *
 * WebSocket upgrades cannot be proxied through Next.js Route Handlers, so when REST uses `/api/nest`,
 * the socket connects **directly** to Nest using {@link getSocketIoBackendOrigin}.
 * Nest `CORS_ORIGINS` must include your Next site origin in production.
 */
export function getCommunityChatSocketTarget(): { url: string; path: string } {
  const clean = getSocketIoBackendOrigin();
  return { url: `${clean}/community-chat`, path: "/socket.io" };
}

/**
 * Socket.IO for 1:1 job application threads (`/job-messaging` namespace).
 * Same origin rules as {@link getCommunityChatSocketTarget}.
 */
export function getJobMessagingSocketTarget(): { url: string; path: string } {
  const clean = getSocketIoBackendOrigin();
  return { url: `${clean}/job-messaging`, path: "/socket.io" };
}

/** Tenant `clientName` query param for public routes (must match backend users). */
export function getPublicClientName(): string {
  const raw = process.env.NEXT_PUBLIC_ANN_CLIENT_NAME?.trim();
  return raw && raw.length > 0 ? raw : "ann";
}

/** Default tenant `clientName` on authenticated request bodies (same value as {@link getPublicClientName}). */
export function getAuthClientName(): string {
  return getPublicClientName();
}
