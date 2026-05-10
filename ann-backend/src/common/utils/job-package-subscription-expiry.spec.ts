import {
  daysInCalendarMonthUtc,
  jobPackageSubscriptionExpiresAtUtc,
} from './job-package-subscription-expiry';

describe('jobPackageSubscriptionExpiresAtUtc', () => {
  it('January purchase adds 31 days', () => {
    const start = new Date(Date.UTC(2026, 0, 15, 12, 0, 0));
    expect(daysInCalendarMonthUtc(start)).toBe(31);
    const end = jobPackageSubscriptionExpiresAtUtc(start);
    expect(end.toISOString()).toBe(
      new Date(Date.UTC(2026, 1, 15, 12, 0, 0)).toISOString(),
    );
  });

  it('April purchase adds 30 days', () => {
    const start = new Date(Date.UTC(2026, 3, 10, 0, 0, 0));
    expect(daysInCalendarMonthUtc(start)).toBe(30);
    const end = jobPackageSubscriptionExpiresAtUtc(start);
    expect(end.toISOString()).toBe(
      new Date(Date.UTC(2026, 4, 10, 0, 0, 0)).toISOString(),
    );
  });

  it('February non–leap year has 28 days', () => {
    const start = new Date(Date.UTC(2025, 1, 1, 0, 0, 0));
    expect(daysInCalendarMonthUtc(start)).toBe(28);
  });

  it('February leap year has 29 days', () => {
    const start = new Date(Date.UTC(2024, 1, 1, 0, 0, 0));
    expect(daysInCalendarMonthUtc(start)).toBe(29);
  });
});
