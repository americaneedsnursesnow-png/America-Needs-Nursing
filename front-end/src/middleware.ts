import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

/**
 * Server-side middleware for auth-based redirects.
 *
 * This ensures Google's crawler (which does not execute JavaScript) sees the
 * correct redirect immediately rather than a client-side loading spinner —
 * preventing Google Ads from flagging the site for cloaking / redirect issues.
 */

/** Routes that require an authenticated session. */
const PROTECTED_PREFIXES = ["/dashboard"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  // Redirect unauthenticated users away from protected pages
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all routes except:
   * - _next/static  (static assets)
   * - _next/image   (image optimizer)
   * - favicon.ico / favicon/*
   * - files/*       (proxied uploads)
   * - api/*         (API routes handle their own auth)
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon|files|api).*)",
  ],
};
