/**
 * Transactional / bulk email HTML shells. Blog alerts and newsletter broadcasts
 * use different visual systems so recipients can tell them apart at a glance.
 */

export function normaliseFrontendBase(raw: string | undefined): string {
  const t = raw?.trim();
  if (!t) return 'http://localhost:3001';
  return t.replace(/\/$/, '');
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Safe for use inside double-quoted HTML attributes (e.g. img src, href). */
export function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Transactional messages (OTP, welcome, job published) — simple branded shell, not marketing-heavy.
 */
export function renderTransactionalEmail(params: {
  title: string;
  innerHtml: string;
  frontendBase: string;
  preheader?: string;
}): string {
  const { title, innerHtml, frontendBase, preheader } = params;
  const t = escapeHtml(title);
  const homeUrl = frontendBase;
  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>${t}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
${preheaderBlock}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:8px;border:1px solid #e2e8f0;">
      <tr><td style="padding:24px 28px 8px 28px;border-bottom:3px solid #dc2626;">
        <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">America Needs Nurses</p>
        <h1 style="margin:8px 0 0 0;font-size:20px;line-height:1.3;font-weight:700;color:#0f172a;">${t}</h1>
      </td></tr>
      <tr><td style="padding:24px 28px;font-size:16px;line-height:1.6;color:#334155;">
        ${innerHtml}
      </td></tr>
      <tr><td style="padding:0 28px 24px 28px;font-size:12px;line-height:1.5;color:#94a3b8;border-top:1px solid #f1f5f9;">
        <p style="margin:16px 0 0 0;">This is an automated message from <a href="${escapeAttr(homeUrl)}" style="color:#64748b;">America Needs Nurses</a>. Please do not reply to this email.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function resolvePublicAssetUrl(
  url: string | null | undefined,
  frontendBase: string,
): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('/')) return `${frontendBase}${u}`;
  return null;
}

/**
 * “New blog post” — editorial layout: dark masthead, optional hero image, serif title, primary CTA.
 */
export function renderBlogPublishEmail(params: {
  title: string;
  excerpt: string;
  slug: string;
  coverImageUrl: string | null;
  frontendBase: string;
}): string {
  const { title, excerpt, slug, coverImageUrl, frontendBase } = params;
  const readUrl = `${frontendBase}/blog/${encodeURIComponent(slug)}`;
  const hero = resolvePublicAssetUrl(coverImageUrl, frontendBase);
  const t = escapeHtml(title);
  const e = escapeHtml(excerpt);
  const heroBlock = hero
    ? `<tr><td style="padding:0 32px 24px 32px;">
          <img src="${escapeAttr(hero)}" alt="" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:12px;border:0;" />
        </td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${t}</title></head>
<body style="margin:0;padding:0;background-color:#0c1222;font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0c1222;">
  <tr><td align="center" style="padding:32px 16px 48px 16px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 24px 48px rgba(0,0,0,0.35);">
      <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#0f172a 100%);padding:28px 32px 24px 32px;">
        <p style="margin:0 0 8px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#93c5fd;">America Needs Nurses · Blog</p>
        <p style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.5;color:#e2e8f0;">A new story is live for you to read.</p>
      </td></tr>
      ${heroBlock}
      <tr><td style="padding:8px 32px 8px 32px;">
        <h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:700;color:#0f172a;">${t}</h1>
      </td></tr>
      <tr><td style="padding:12px 32px 28px 32px;">
        <p style="margin:0;font-size:17px;line-height:1.65;color:#475569;">${e}</p>
      </td></tr>
      <tr><td style="padding:0 32px 36px 32px;">
        <table role="presentation" cellspacing="0" cellpadding="0"><tr>
          <td style="border-radius:999px;background-color:#dc2626;">
            <a href="${escapeAttr(readUrl)}" style="display:inline-block;padding:14px 28px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Read the full article</a>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:0 32px 32px 32px;border-top:1px solid #e2e8f0;">
        <p style="margin:20px 0 0 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.5;color:#94a3b8;">You are receiving this because you subscribed to updates. Open the link above in your browser if the button does not work:<br/><a href="${escapeAttr(readUrl)}" style="color:#64748b;word-break:break-all;">${escapeHtml(readUrl)}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/**
 * Staff newsletter broadcast — letter-style layout: light frame, crimson accent rail, sans body for admin HTML.
 */
export function wrapNewsletterBroadcastEmail(params: {
  innerHtml: string;
  frontendBase: string;
}): string {
  const { innerHtml, frontendBase } = params;
  const homeUrl = frontendBase;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Newsletter</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <tr><td style="padding:0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td width="6" style="width:6px;background-color:#b91c1c;font-size:0;line-height:0;">&nbsp;</td>
            <td style="padding:24px 28px 20px 24px;">
              <p style="margin:0 0 4px 0;font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#71717a;">Official notice</p>
              <p style="margin:0;font-size:20px;font-weight:700;color:#18181b;letter-spacing:-0.02em;">ANN newsletter</p>
              <p style="margin:10px 0 0 0;font-size:13px;line-height:1.5;color:#71717a;">Message from your hiring &amp; careers platform team.</p>
            </td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:8px 28px 36px 28px;border-top:1px solid #f4f4f5;">
        <div style="font-size:16px;line-height:1.6;color:#27272a;">
          ${innerHtml}
        </div>
      </td></tr>
      <tr><td style="padding:20px 28px 24px 28px;background-color:#fafafa;border-top:1px solid #e4e4e7;">
        <p style="margin:0;font-size:12px;line-height:1.55;color:#71717a;">This email was sent to you as a nurse or employer account on America Needs Nurses. If you have questions, visit <a href="${escapeAttr(homeUrl)}" style="color:#b91c1c;text-decoration:underline;">${escapeHtml(homeUrl)}</a>.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
