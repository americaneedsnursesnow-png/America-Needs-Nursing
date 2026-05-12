/**
 * Run after `next build`. Fails if hashed static output is missing (production CSS/JS 404s).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const nextDir = path.join(root, ".next");

function fail(msg) {
  console.error(`verify-next-build: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(nextDir)) {
  fail("`.next` directory missing — run `npm run build` first.");
}

if (!fs.existsSync(path.join(nextDir, "BUILD_ID"))) {
  fail("`.next/BUILD_ID` missing — build may have failed silently.");
}

const cssDir = path.join(nextDir, "static", "css");
if (!fs.existsSync(cssDir)) {
  fail("`.next/static/css` missing — Tailwind/global CSS will 404 in production.");
}
const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css"));
if (cssFiles.length === 0) {
  fail("`.next/static/css` has no `.css` files — site will load unstyled.");
}

const chunksDir = path.join(nextDir, "static", "chunks");
if (!fs.existsSync(chunksDir)) {
  fail("`.next/static/chunks` missing — JS chunks will 404.");
}
const chunkFiles = fs.readdirSync(chunksDir).filter((f) => f.endsWith(".js"));
if (chunkFiles.length === 0) {
  fail("`.next/static/chunks` has no `.js` files.");
}

console.log(
  `verify-next-build: ok (${cssFiles.length} css, ${chunkFiles.length} chunk files)`,
);
