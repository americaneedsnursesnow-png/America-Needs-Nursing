"use client";

import { useEffect } from "react";

const STORAGE_KEY = "ann_chunk_reload_at";

function chunkFailureMessage(reason: unknown): string {
  if (reason instanceof Error) {
    return reason.message;
  }
  return String(reason);
}

function isChunkLoadFailure(message: string): boolean {
  return (
    /ChunkLoadError|Loading chunk \d+ failed|chunk load failed/i.test(
      message,
    ) || /Importing a module script failed/i.test(message)
  );
}

function shouldReloadNow(): boolean {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  const now = Date.now();
  if (raw) {
    const last = Number.parseInt(raw, 10);
    if (Number.isFinite(last) && now - last < 12_000) {
      return false;
    }
  }
  sessionStorage.setItem(STORAGE_KEY, String(now));
  return true;
}

/** Script or stylesheet from this build's hashed `/_next/static` tree failed to load (often 404 after deploy). */
function isFailedNextStaticAsset(target: EventTarget | null): boolean {
  if (target instanceof HTMLScriptElement) {
    return target.src.includes("/_next/static/");
  }
  if (target instanceof HTMLLinkElement) {
    const rel = (target.rel || "").toLowerCase();
    if (rel !== "stylesheet" && !rel.split(/\s+/).includes("stylesheet")) {
      return false;
    }
    return (
      typeof target.href === "string" && target.href.includes("/_next/static/")
    );
  }
  return false;
}

/**
 * After a new deploy, cached HTML can reference old hashed assets under `/_next/static/`,
 * which 404 and break JS (ChunkLoadError) or leave the app unstyled (CSS 404). One full
 * reload fetches fresh HTML + asset names.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const tryReload = (reason: unknown) => {
      if (!isChunkLoadFailure(chunkFailureMessage(reason))) {
        return;
      }
      if (!shouldReloadNow()) {
        return;
      }
      window.location.reload();
    };

    const onWindowError = (event: ErrorEvent) => {
      if (isFailedNextStaticAsset(event.target)) {
        if (shouldReloadNow()) {
          window.location.reload();
        }
        return;
      }
      tryReload(event.error ?? event.message);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      tryReload(event.reason);
    };

    window.addEventListener("error", onWindowError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onWindowError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
