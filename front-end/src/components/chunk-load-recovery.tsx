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

/**
 * After a new deploy, cached HTML can reference old hashed chunks under `/_next/static/`,
 * which 404 and surface as ChunkLoadError. A single hard reload fetches fresh HTML + assets.
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
      const target = event.target;
      if (
        target instanceof HTMLScriptElement &&
        target.src.includes("/_next/static/")
      ) {
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
