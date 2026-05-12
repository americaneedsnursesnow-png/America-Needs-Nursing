/**
 * Run after `nest build`. Fails if compiled entry is missing.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const mainJs = path.join(root, "dist", "main.js");

if (!fs.existsSync(mainJs)) {
  console.error(
    "verify-nest-build: `dist/main.js` missing — run `npm run build` in ann-backend.",
  );
  process.exit(1);
}

console.log("verify-nest-build: ok");
