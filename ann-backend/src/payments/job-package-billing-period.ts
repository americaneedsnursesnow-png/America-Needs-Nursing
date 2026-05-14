/**
 * One calendar month after `anchor`, preserving UTC clock time where possible.
 * Clamps the day when the target month is shorter (e.g. Jan 31 → Feb 28/29).
 */
export function addOneCalendarMonthUtc(anchor: Date): Date {
  const y = anchor.getUTCFullYear();
  const m = anchor.getUTCMonth();
  const day = anchor.getUTCDate();
  const h = anchor.getUTCHours();
  const min = anchor.getUTCMinutes();
  const s = anchor.getUTCSeconds();
  const ms = anchor.getUTCMilliseconds();
  const targetMonth = m + 1;
  const lastDayOfTargetMonth = new Date(
    Date.UTC(y, targetMonth + 1, 0),
  ).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);
  return new Date(Date.UTC(y, targetMonth, clampedDay, h, min, s, ms));
}
