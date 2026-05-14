import { spacingFetch } from "./api-request-spacing";
import { getApiBaseUrl } from "./env";

export class BackendRequestError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "BackendRequestError";
    this.status = status;
    this.body = body;
  }
}

function extractErrorMessage(
  status: number,
  statusText: string,
  data: unknown,
  rawBody: string,
): string {
  const parts: string[] = [];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const msg = obj.message;
    if (Array.isArray(msg)) {
      parts.push(msg.map(String).join(". "));
    } else if (typeof msg === "string" && msg.trim()) {
      parts.push(msg.trim());
    }
    if (typeof obj.description === "string" && obj.description.trim()) {
      parts.push(obj.description.trim());
    }
    const err = obj.error;
    if (typeof err === "string" && err.trim() && err !== "Bad Request") {
      parts.push(err.trim());
    }
    const type = obj.type;
    if (typeof type === "string" && type.trim() && type !== "Error") {
      parts.push(`(${type})`);
    }
  }
  let base =
    parts.filter(Boolean).join(" — ").trim() ||
    statusText.trim() ||
    "Request failed";
  if (base === "Request failed" && rawBody && data === null) {
    const snippet = rawBody.replace(/\s+/g, " ").slice(0, 140);
    if (status === 404) {
      base = `No proxy route (HTTP 404). Add /api/nest rewrites in next.config and restart dev. ${snippet}`;
    } else if (status === 502 || status === 504) {
      base = `Nest unreachable (${status}). Check API_UPSTREAM_URL and that the backend is running. ${snippet}`;
    } else {
      base = `${base}. ${snippet}`;
    }
  }
  if (
    status === 400 &&
    (base === "Bad Request" || base === "Request failed") &&
    rawBody
  ) {
    const snippet = rawBody.replace(/\s+/g, " ").slice(0, 280);
    base = `${base}. Body: ${snippet}`;
  }
  if (
    status === 400 &&
    (base.startsWith("Bad Request") || base === "Request failed") &&
    !rawBody?.trim()
  ) {
    base = `${base}. For Stripe checkout: open the request in DevTools → Response for Nest’s message. Common causes: successUrl/cancelUrl rejected (Nest @IsUrl often blocks localhost—use require_tld: false in the DTO), missing STRIPE_SECRET_KEY on ann-backend, invalid package stripePriceId, or charge amount under $0.50 USD.`;
  }
  return `${base} (HTTP ${status})`;
}

const NETWORK_ERROR_HINT =
  "Ensure ann-backend is running. If the browser uses same-origin /api/nest, set API_UPSTREAM_URL on Next. If it calls the API host directly, set NEXT_PUBLIC_API_BASE_URL to that https URL and allow CORS on Nest.";

function throwOnNetworkFailure(caught: unknown): never {
  const base =
    caught instanceof TypeError
      ? caught.message
      : caught instanceof Error
        ? caught.message
        : "Request failed";
  throw new BackendRequestError(503, `${base}. ${NETWORK_ERROR_HINT}`, caught);
}

async function spacingFetchWithNetworkHandling(
  path: string,
  headers: HeadersInit,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await spacingFetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: { ...headers, ...init?.headers },
    });
  } catch (e) {
    throwOnNetworkFailure(e);
  }
}

/** Prefer arrayBuffer + decode — more reliable than text() with some proxies/compression edge cases. */
async function readResponseTextSafe(res: Response): Promise<string> {
  try {
    const buf = await res.arrayBuffer();
    return new TextDecoder().decode(buf);
  } catch (e) {
    throwOnNetworkFailure(e);
  }
}

async function readResponseBlobSafe(res: Response): Promise<Blob> {
  try {
    return await res.blob();
  } catch (e) {
    throwOnNetworkFailure(e);
  }
}

export async function authedJson<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const isBodyless = method === "GET" || method === "HEAD";
  // GET + Content-Type: application/json forces an unnecessary CORS preflight
  // on cross-origin calls; omit it for bodyless requests.
  const res = await spacingFetchWithNetworkHandling(
    path,
    {
      Accept: "application/json",
      ...(isBodyless ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${accessToken}`,
    },
    init,
  );
  const text = await readResponseTextSafe(res);
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new BackendRequestError(
      res.status,
      extractErrorMessage(res.status, res.statusText, data, text),
      data,
    );
  }
  return data as T;
}

/**
 * DELETE/POST etc. with empty 204/200 body. Treats 2xx with no JSON as success.
 */
export async function authedVoid(
  path: string,
  accessToken: string,
  init: RequestInit,
): Promise<void> {
  const res = await spacingFetchWithNetworkHandling(
    path,
    {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    init,
  );
  const text = await readResponseTextSafe(res);
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    throw new BackendRequestError(
      res.status,
      extractErrorMessage(res.status, res.statusText, data, text),
      data,
    );
  }
}

/** Binary success body (e.g. PDF stream). On error, reads text and parses JSON when possible. */
export async function authedBlob(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<Blob> {
  const res = await spacingFetchWithNetworkHandling(
    path,
    { Authorization: `Bearer ${accessToken}` },
    init,
  );
  if (!res.ok) {
    const text = await readResponseTextSafe(res);
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    throw new BackendRequestError(
      res.status,
      extractErrorMessage(res.status, res.statusText, data, text),
      data,
    );
  }
  return readResponseBlobSafe(res);
}

/** POST multipart (do not set Content-Type — browser sets boundary). */
export async function authedMultipartJson<T>(
  path: string,
  accessToken: string,
  formData: FormData,
): Promise<T> {
  const res = await spacingFetchWithNetworkHandling(
    path,
    {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    { method: "POST", body: formData },
  );
  const text = await readResponseTextSafe(res);
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new BackendRequestError(
      res.status,
      extractErrorMessage(res.status, res.statusText, data, text),
      data,
    );
  }
  return data as T;
}
