/**
 * Keeps httpOnly session cookie in sync with localStorage token (client-only).
 */
export async function syncSessionCookie(token: string | null): Promise<void> {
  if (typeof window === "undefined") return;
  if (!token?.trim()) {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    return;
  }
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token.trim() }),
  }).catch(() => {});
}
