/** Extract bare address from `Name <user@host>` or return trimmed input. */
export function extractEmailAddress(from: string): string {
  const trimmed = from.trim();
  const angle = trimmed.match(/<([^>]+)>/);
  if (angle?.[1]) return angle[1].trim();
  return trimmed;
}

/** RFC 2369 List-Unsubscribe value (https + optional mailto). */
export function buildListUnsubscribeHeader(
  httpsUrl: string | undefined,
  mailto: string | undefined,
): string | undefined {
  const parts: string[] = [];
  const url = httpsUrl?.trim();
  const mail = mailto?.trim();
  if (url && /^https:\/\//i.test(url)) {
    parts.push(`<${url}>`);
  }
  if (mail && mail.includes('@')) {
    parts.push(`<mailto:${mail}>`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}
