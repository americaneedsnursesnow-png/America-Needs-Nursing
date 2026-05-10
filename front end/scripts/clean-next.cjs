/**
 * Windows-safe removal of `.next` before `next build`.
 * Avoids ENOTEMPTY when Next's internal rmdir runs on a partially locked tree.
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(process.cwd(), ".next");
if (fs.existsSync(dir)) {
  fs.rmSync(dir, { recursive: true, force: true });
}
