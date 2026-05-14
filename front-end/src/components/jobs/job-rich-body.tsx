import { sanitizeBlogRichHtml, sanitizeJobRichHtml } from "@/lib/sanitize-job-html";

/**
 * Detect TipTap / HTML bodies for **job** descriptions (legacy plain text allowed).
 * Must match tags whose name extends past two characters (`<h1>`, `<strong>`, `<blockquote>`);
 * the old `<[a-z][\s>/]` check only matched when the third character was space, `/`, or `>`.
 */
const looksLikeRichHtml = (s: string) => {
  const t = s.trim();
  return /^<\s*[a-z][a-z0-9-]*(\s|\/?>)/i.test(t);
};

type JobRichBodyProps = {
  html: string;
  /** Extra classes on the wrapper (e.g. blog `text-xl`). */
  className?: string;
  /**
   * `blog` allows inline images from `/files/blog-images/…` (admin uploads).
   * `job` strips all media (job descriptions).
   */
  variant?: "job" | "blog";
};

/** Renders legacy plain text with line breaks, or sanitized HTML from the rich editor. */
export function JobRichBody({
  html,
  className = "",
  variant = "job",
}: JobRichBodyProps) {
  const t = html.trim();
  if (!t) {
    return null;
  }
  // Blog bodies always come from TipTap as HTML (even a single `<h1>…` opening); skip
  // plain-text fallback so headings/bold are never misclassified.
  if (variant !== "blog" && !looksLikeRichHtml(html)) {
    return (
      <div
        className={`whitespace-pre-line text-base leading-relaxed text-gray-700 ${className}`}
      >
        {html}
      </div>
    );
  }
  const clean =
    variant === "blog" ? sanitizeBlogRichHtml(html) : sanitizeJobRichHtml(html);
  return (
    <div
      className={`job-rich-html text-base leading-relaxed text-gray-700 ${className}`}
      dangerouslySetInnerHTML={{
        __html: clean,
      }}
    />
  );
}
