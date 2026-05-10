/**
 * Subscription length = number of days in the calendar month when purchase occurs
 * (Jan/Mar/May/Jul/Aug/Oct/Dec → 31, Apr/Jun/Sep/Nov → 30, Feb → 28 or 29 leap year).
 * Expiry = purchase instant + that many days (UTC calendar math).
 */
export function daysInCalendarMonthUtc(d: Date): number {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

export function addDaysUtc(d: Date, days: number): Date {
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** When a plan is purchased at `purchaseAt`, it stays active for N days where N = days in that month. */
export function jobPackageSubscriptionExpiresAtUtc(purchaseAt: Date): Date {
  const n = daysInCalendarMonthUtc(purchaseAt);
  return addDaysUtc(purchaseAt, n);
}
