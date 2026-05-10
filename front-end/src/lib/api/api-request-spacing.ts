/**
 * Browser: mutating requests (POST/PUT/PATCH/DELETE) are spaced so rapid writes
 * do not stampede the API. Safe reads (GET/HEAD/OPTIONS) run in parallel so
 * `Promise.all` on the dashboard is not forced sequential (which was very slow).
 * Server/SSR: direct fetch everywhere.
 */
const BROWSER_MIN_GAP_MS = 200;

let afterPrevious = Promise.resolve();

function isMutatingMethod(init?: RequestInit): boolean {
  const m = (init?.method ?? "GET").toUpperCase();
  return !["GET", "HEAD", "OPTIONS"].includes(m);
}

export function spacingFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (typeof window === "undefined") {
    return fetch(input, init);
  }
  if (!isMutatingMethod(init)) {
    return fetch(input, init);
  }
  return runAfterBrowserSpacing(() => fetch(input, init));
}

export function runAfterBrowserSpacing<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof window === "undefined") {
    return fn();
  }
  const run = afterPrevious.then(() => fn());
  afterPrevious = run
    .catch(() => {
      /* do not let failures block the queue */
    })
    .then(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, BROWSER_MIN_GAP_MS);
        }),
    );
  return run;
}
