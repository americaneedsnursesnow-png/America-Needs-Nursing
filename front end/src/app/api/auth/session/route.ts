import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  SESSION_COOKIE_MAX_AGE_SEC,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session-cookie";

const MAX_TOKEN_LEN = 16_384;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const token = (body as { token?: unknown }).token;
  if (typeof token !== "string" || !token.trim()) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }
  if (token.length > MAX_TOKEN_LEN) {
    return NextResponse.json({ ok: false, error: "token_too_large" }, { status: 400 });
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token.trim(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SEC,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
