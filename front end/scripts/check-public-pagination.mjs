/**
 * Smoke-test paginated public API against a running Nest backend.
 *
 * Usage:
 *   node scripts/check-public-pagination.mjs
 *   node scripts/check-public-pagination.mjs http://127.0.0.1:3000 myclient
 *
 * Or set API_BASE_URL and ANN_CLIENT_NAME in the environment.
 */
const base = (process.env.API_BASE_URL || process.argv[2] || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const clientName = process.env.ANN_CLIENT_NAME || process.argv[3] || "ann";

async function check(path) {
  const url = `${base}${path}${path.includes("?") ? "&" : "?"}clientName=${encodeURIComponent(clientName)}`;
  const res = await fetch(url);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error(path, res.status, text.slice(0, 200));
    return;
  }
  console.log("\n", path);
  console.log(" status:", res.status);
  if (json.meta) {
    console.log(" meta:", json.meta);
    console.log(" items:", Array.isArray(json.items) ? json.items.length : "n/a");
  } else if (json.company && json.jobs) {
    console.log(" company:", json.company?.name);
    console.log(" jobs:", json.jobs?.length, "jobsMeta:", json.jobsMeta ?? "(none)");
  } else {
    console.log(" keys:", Object.keys(json));
  }
}

await check("/public/companies?page=1&limit=5");
await check("/public/jobs?page=1&limit=5");
await check("/public/blog/posts?page=1&limit=5");
await check("/public/companies/featured?page=1&limit=5");
console.log("\nDone.");
