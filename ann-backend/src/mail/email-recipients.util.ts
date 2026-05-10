/**
 * Ensures each mailbox receives at most one copy: trim, lowercase (case-insensitive
 * identity per common SMTP practice), drop blanks, then unique.
 */
export function uniqueEmailRecipients(recipients: readonly string[]): string[] {
  return [
    ...new Set(
      recipients.map((e) => e.trim().toLowerCase()).filter((e) => e.length > 0),
    ),
  ];
}
