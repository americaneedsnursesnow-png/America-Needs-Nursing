/**
 * Turn stored rich-HTML (TipTap) into a short plain line for cards and list excerpts.
 * SSR-safe — no DOM. Does not preserve bold in preview (only the article page renders HTML).
 */
export function plainTextPreviewFromHtml(
  html: string | null | undefined,
  maxChars: number,
): string {
  if (html == null) return "";
  const stripped = String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return "";
  if (stripped.length <= maxChars) return stripped;
  return `${stripped.slice(0, maxChars).trimEnd()}…`;
}
