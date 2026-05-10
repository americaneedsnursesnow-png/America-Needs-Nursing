import sanitizeHtml from 'sanitize-html';

const JOB_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'blockquote',
  'code',
  'pre',
  's',
  'del',
  'strike',
  'hr',
  'a',
] as const;

/** Rich job / community post HTML (TipTap-style); no images. Links limited to http(s)/mailto. */
const JOB_RICH_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...JOB_TAGS],
  allowedAttributes: {
    '*': ['class'],
    a: ['href', 'rel', 'target', 'title'],
  },
  allowedSchemesByTag: {
    a: ['http', 'https', 'mailto'],
  },
};

function isTrustedBlogImageSrc(src: string): boolean {
  const t = src.trim();
  if (!t || /^javascript:/i.test(t) || /^data:/i.test(t)) {
    return false;
  }
  if (t.startsWith('/files/blog-images/')) {
    return true;
  }
  try {
    if (/^https?:\/\//i.test(t)) {
      const u = new URL(t);
      return u.pathname.includes('/files/blog-images/');
    }
  } catch {
    return false;
  }
  return false;
}

const BLOG_RICH_OPTIONS: sanitizeHtml.IOptions = {
  ...JOB_RICH_OPTIONS,
  allowedTags: [...JOB_TAGS, 'img'],
  allowedAttributes: {
    ...JOB_RICH_OPTIONS.allowedAttributes,
    img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'class'],
  },
  exclusiveFilter(frame) {
    return (
      frame.tag === 'img' &&
      !isTrustedBlogImageSrc(String(frame.attribs.src ?? ''))
    );
  },
};

/** Chat / DM: strip all tags, keep text (mitigates stored XSS). */
const CHAT_STRIP_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

export function sanitizeJobRichHtml(html: string): string {
  return sanitizeHtml(html ?? '', JOB_RICH_OPTIONS);
}

export function sanitizeBlogRichHtml(html: string): string {
  return sanitizeHtml(html ?? '', BLOG_RICH_OPTIONS);
}

export function sanitizeChatPlainHtml(html: string): string {
  return sanitizeHtml(html ?? '', CHAT_STRIP_OPTIONS).trim();
}
