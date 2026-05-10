/** Per-token: strip quotes, angle brackets, trailing junk from CSV cells. */
function normalizeToken(raw: string): string {
  let s = raw
    .replace(/^\s+|\s+$/g, '')
    .replace(/^["']|["']$/g, '')
    .replace(/^<|>$/g, '');
  s = s.replace(/mailto:/gi, '');
  s = s.replace(/[>),\]}]+$/, '');
  return s.trim();
}

// RFC-like practical email check (same order of magnitude as HTML5 `input type=email`)
const LOOSE_EMAIL =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Splits lines on newlines, then each line on commas/semicolons, normalizes, dedupes.
 * Works for single-column "email" lists, standard CSV, or "Name,email,..." rows.
 */
export function parseEmailsFromBulkCsvText(raw: string): {
  emails: string[];
} {
  const text = raw
    .replace(/\u00A0/g, ' ')
    .replace(/^\uFEFF/, '');
  const seen = new Set<string>();
  const emails: string[] = [];
  const lineParts = text.split(/\r?\n/);
  for (const line of lineParts) {
    if (!line.trim() || /^\s*#/.test(line)) {
      continue;
    }
    const parts = line.split(/[,;|]\s*/);
    for (const part of parts) {
      const t = normalizeToken(part);
      if (!t) continue;
      if (!t.includes('@')) continue;
      const n = t.toLowerCase();
      if (n.length > 254) continue;
      if (!LOOSE_EMAIL.test(n)) continue;
      if (seen.has(n)) continue;
      seen.add(n);
      emails.push(n);
    }
  }
  return { emails };
}
