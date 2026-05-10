import DOMPurify from "isomorphic-dompurify";

/**
 * Strip tags for previews (cards, meta). Safe on server and client.
 * Collapses whitespace so line-clamp works predictably.
 */
export function htmlToPlainText(html: string | null | undefined): string {
  if (html == null || typeof html !== "string") return "";
  const trimmed = html.trim();
  if (!trimmed) return "";
  const stripped = DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
  return stripped.replace(/\s+/g, " ").trim();
}
