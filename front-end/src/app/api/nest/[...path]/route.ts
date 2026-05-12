import { type NextRequest, NextResponse } from "next/server";

import { getApiUpstreamUrl } from "@/lib/api/env.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildTargetUrl(req: NextRequest, pathSegments: string[]): string {
  const upstream = getApiUpstreamUrl();
  const sub = pathSegments.length > 0 ? pathSegments.join("/") : "";
  const qs = req.nextUrl.search;
  return sub ? `${upstream}/${sub}${qs}` : `${upstream}${qs}`;
}

/** Forward client headers to Nest (rewrites alone do not reliably pass `Authorization`). */
function forwardHeaders(req: NextRequest): Headers {
  const h = new Headers(req.headers);
  h.delete("host");
  h.delete("connection");
  h.delete("content-length");
  return h;
}

function getFetchErrorCode(error: unknown): string | undefined {
  if (!(error instanceof TypeError)) return undefined;
  const cause = (error as { cause?: unknown }).cause;
  if (cause && typeof cause === "object" && "code" in cause) {
    return String((cause as { code: unknown }).code);
  }
  return undefined;
}

function upstreamUnavailableResponse(upstream: string, error: unknown): NextResponse {
  const code = getFetchErrorCode(error);
  const hint =
    code === "ECONNREFUSED"
      ? "Nothing is listening on that host/port. Start ann-backend (Nest) and ensure its PORT matches API_UPSTREAM_URL."
      : "Check that ann-backend is running and API_UPSTREAM_URL in .env.local points to it (default http://127.0.0.1:3001).";

  return NextResponse.json(
    {
      statusCode: 503,
      error: "Service Unavailable",
      message: "Next.js could not reach the Nest API (upstream fetch failed).",
      hint,
      ...(process.env.NODE_ENV === "development"
        ? { upstream, fetchErrorCode: code }
        : {}),
    },
    { status: 503 },
  );
}

/** Above this size, stream the body (large downloads); below, buffer for stable client reads. */
const MAX_BUFFERED_BODY_BYTES = 25 * 1024 * 1024;

async function fetchUpstreamWithRetry(
  target: string,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(target, init);
  } catch (first) {
    const code = getFetchErrorCode(first);
    if (code === "ECONNREFUSED") {
      await new Promise((r) => setTimeout(r, 200));
      return await fetch(target, init);
    }
    throw first;
  }
}

function copySafeUpstreamHeaders(
  from: Headers,
  to: Headers,
  mode: "buffered" | "streamed",
): void {
  from.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === "transfer-encoding") return;
    if (mode === "buffered") {
      // Node fetch may decompress the body but leave Content-Encoding; forwarding it breaks browsers.
      if (k === "content-length" || k === "content-encoding") return;
    }
    to.set(key, value);
  });
}

async function proxy(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const upstream = getApiUpstreamUrl();
  const target = buildTargetUrl(req, pathSegments);
  const headers = forwardHeaders(req);
  /** Avoid gzip then decompress mismatch when forwarding headers to the browser response. */
  headers.set("accept-encoding", "identity");
  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
    Object.assign(init, { duplex: "half" as const });
  }

  try {
    const res = await fetchUpstreamWithRetry(target, init);
    const lenRaw = res.headers.get("content-length");
    const parsedLen = lenRaw ? parseInt(lenRaw, 10) : NaN;
    const streamHuge =
      Number.isFinite(parsedLen) && parsedLen > MAX_BUFFERED_BODY_BYTES;

    let body: BodyInit;
    if (streamHuge && res.body) {
      body = res.body;
    } else {
      body = await res.arrayBuffer();
    }

    const out = new NextResponse(body, {
      status: res.status,
      statusText: res.statusText,
    });
    copySafeUpstreamHeaders(
      res.headers,
      out.headers,
      streamHuge ? "streamed" : "buffered",
    );
    if (!streamHuge && body instanceof ArrayBuffer) {
      out.headers.set("content-length", String(body.byteLength));
    }
    return out;
  } catch (error) {
    return upstreamUnavailableResponse(upstream, error);
  }
}

type RouteCtx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function OPTIONS(req: NextRequest, ctx: RouteCtx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}
