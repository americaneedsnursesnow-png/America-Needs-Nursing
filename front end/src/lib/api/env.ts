/**
 * Base URL for REST (and browser fetch targets).
 *
 * - **Browser:** always same-origin `/api/nest` (proxied by `app/api/nest/[...path]/route.ts`).
 *   `NEXT_PUBLIC_API_BASE_URL` does **not** apply in the browser — direct calls caused CORS /
 *   Private Network Access failures for many dev setups. Configure Nest via `API_UPSTREAM_URL`
 *   on the Next server instead.
 * - **Server (SSR / Route Handlers):** `NEXT_PUBLIC_API_BASE_URL` if set, else `API_UPSTREAM_URL`,
 *   else `http://127.0.0.1:3000`.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/nest";
  }
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw && raw.length > 0) {
    return raw.replace(/\/$/, "");
  }
  const internal = process.env.API_UPSTREAM_URL?.trim() || "http://127.0.0.1:3000";
  return internal.replace(/\/$/, "");
}

/**
 * Socket.IO for `/community-chat`. Call only from the client (e.g. `useEffect`).
 *
 * WebSocket upgrades cannot be proxied through Next.js Route Handlers, so when REST uses `/api/nest`,
 * the socket connects **directly** to Nest via `NEXT_PUBLIC_NEST_SOCKET_ORIGIN` (defaults to 127.0.0.1:3000).
 * Nest CORS must allow your Next origin (ann-backend uses `origin: true`).
 */
export function getCommunityChatSocketTarget(): { url: string; path: string } {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw && /^https?:\/\//i.test(raw)) {
    const clean = raw.replace(/\/$/, "");
    return { url: `${clean}/community-chat`, path: "/socket.io" };
  }
  // Prefer `localhost` over 127.0.0.1 so browser origin matches (helps WS upgrade if enabled).
  const nest =
    process.env.NEXT_PUBLIC_NEST_SOCKET_ORIGIN?.trim() ||
    "http://localhost:3000";
  const clean = nest.replace(/\/$/, "");
  return { url: `${clean}/community-chat`, path: "/socket.io" };
}

/**
 * Socket.IO for 1:1 job application threads (`/job-messaging` namespace).
 * Same origin rules as {@link getCommunityChatSocketTarget}.
 */
export function getJobMessagingSocketTarget(): { url: string; path: string } {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw && /^https?:\/\//i.test(raw)) {
    const clean = raw.replace(/\/$/, "");
    return { url: `${clean}/job-messaging`, path: "/socket.io" };
  }
  const nest =
    process.env.NEXT_PUBLIC_NEST_SOCKET_ORIGIN?.trim() ||
    "http://localhost:3000";
  const clean = nest.replace(/\/$/, "");
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
