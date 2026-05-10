import "server-only";

import type { AuthUserRole } from "@/lib/api/auth-api";

function base64UrlToUtf8(segment: string): string {
  const pad = segment.length % 4 === 0 ? "" : "=".repeat(4 - (segment.length % 4));
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

/**
 * Reads `role` from JWT payload without verifying the signature (not for authz).
 * Used only to choose which server prefetch path to run; APIs still enforce access.
 */
export function readJwtRole(token: string): AuthUserRole | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = JSON.parse(base64UrlToUtf8(parts[1])) as { role?: unknown };
    const r = json.role;
    if (
      r === "nurse" ||
      r === "employer" ||
      r === "admin" ||
      r === "content_admin" ||
      r === "super_admin"
    ) {
      return r;
    }
    return null;
  } catch {
    return null;
  }
}
