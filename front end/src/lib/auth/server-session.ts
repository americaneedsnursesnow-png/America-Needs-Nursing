import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "./session-cookie";

export async function getServerAccessToken(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE_NAME)?.value;
  const t = raw?.trim();
  return t ? t : null;
}
