import DOMPurify from "isomorphic-dompurify";

/** Tags TipTap StarterKit may emit for job description / requirements. */
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "code",
  "pre",
  "s",
  "del",
  "strike",
  "hr",
];

const BLOG_BODY_TAGS = [...ALLOWED_TAGS, "img"] as const;

/** Safe attributes for blog HTML (TipTap + inline images). `src` restricted by hook. */
const BLOG_BODY_ATTR = [
  "class",
  "src",
  "alt",
  "loading",
  "width",
  "height",
  "decoding",
  "style",
] as const;

/** Only images served from our uploads (`POST /blog/posts/images`) or same path over absolute API URL. */
export function isTrustedBlogImageSrc(src: string): boolean {
  const t = src.trim();
  if (!t || /^javascript:/i.test(t) || /^data:/i.test(t)) return false;
  if (t.startsWith("/files/blog-images/")) return true;
  try {
    if (/^https?:\/\//i.test(t)) {
      const u = new URL(t);
      return u.pathname.includes("/files/blog-images/");
    }
  } catch {
    return false;
  }
  return false;
}

type AttrHookEvent = {
  attrName: string;
  attrValue: string;
  keepAttr: boolean;
};

function restrictBlogAttrs(node: Element, hookEvent: AttrHookEvent): void {
  if (hookEvent.attrName === "src" && node.nodeName !== "IMG") {
    hookEvent.keepAttr = false;
  }
  if (node.nodeName === "IMG" && hookEvent.attrName === "src") {
    if (!isTrustedBlogImageSrc(String(hookEvent.attrValue ?? ""))) {
      hookEvent.keepAttr = false;
    }
  }
}

/** Blog post body: StarterKit HTML plus `<img>` with trusted `/files/blog-images/…` sources only. */
export function sanitizeBlogRichHtml(html: string): string {
  DOMPurify.addHook("uponSanitizeAttribute", restrictBlogAttrs);
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [...BLOG_BODY_TAGS],
      ALLOWED_ATTR: [...BLOG_BODY_ATTR],
    });
  } finally {
    DOMPurify.removeHook("uponSanitizeAttribute", restrictBlogAttrs);
  }
}

export function sanitizeJobRichHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
  });
}

/** Client-side check before submit (strip tags / nbsp). */
export function isRichTextEffectivelyEmpty(html: string): boolean {
  const stripped = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length === 0;
}
