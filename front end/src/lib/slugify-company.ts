/** Build a URL-safe company slug (matches typical backend expectations). */
export function slugifyCompanyName(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
  return s.length > 0 ? s : "company";
}
