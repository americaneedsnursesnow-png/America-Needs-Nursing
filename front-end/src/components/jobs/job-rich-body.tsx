import { sanitizeBlogRichHtml, sanitizeJobRichHtml } from "@/lib/sanitize-job-html";

/** Detect TipTap / HTML bodies; `<img` can be first node without a leading `<p>`. */
const looksLikeRichHtml = (s: string) => {
  const t = s.trim();
  return /<[a-z][\s>/]/i.test(t) || /^<\s*img\b/i.test(t);
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
  if (!looksLikeRichHtml(html)) {
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
