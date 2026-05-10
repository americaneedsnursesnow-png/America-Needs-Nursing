/**
 * Stripe minimum charge amounts in the same units as `unit_amount` / `price_data`.
 * @see https://docs.stripe.com/currencies#minimum-and-maximum-charge-amounts
 */
const STRIPE_MIN_CHARGE_UNITS: Record<string, number> = {
  usd: 50,
  aed: 200,
  ars: 50,
  aud: 50,
  brl: 50,
  cad: 50,
  chf: 50,
  cop: 50,
  czk: 1500,
  dkk: 250,
  eur: 50,
  gbp: 30,
  hkd: 400,
  huf: 17500,
  ils: 50,
  inr: 50,
  jpy: 50,
  krw: 50,
  mxn: 1000,
  myr: 200,
  nok: 300,
  nzd: 50,
  php: 50,
  pln: 200,
  ron: 200,
  rub: 50,
  sek: 300,
  sgd: 50,
  thb: 1000,
  zar: 50,
};

/**
 * Returns minimum `unit_amount` for Checkout `price_data`, or `undefined` if unknown (Stripe will enforce).
 */
export function stripeMinimumChargeUnits(currency: string): number | undefined {
  return STRIPE_MIN_CHARGE_UNITS[currency.trim().toLowerCase()];
}

/**
 * Explains cents vs dollars and Stripe Price vs DB fields when checkout is below minimum.
 */
export function describeBelowStripeMinimum(params: {
  currency: string;
  unitAmount: number;
  minUnits: number;
  packageName: string;
  /** e.g. stripePriceId value or price_ id for support */
  amountReference?: string;
}): string {
  const c = params.currency.trim().toLowerCase();
  const C = c.toUpperCase();
  const parts: string[] = [
    `Stripe refused checkout: the session total must be at least ${params.minUnits} ${C} in smallest currency units (USD: 50 = fifty cents = $0.50).`,
    `Package "${params.packageName}" is set to charge ${params.unitAmount} in that unit (not dollars).`,
  ];
  if (params.amountReference) {
    parts.push(
      `Amount reference in your catalog/DB: \`${params.amountReference}\`.`,
    );
  }
  if (c === 'usd') {
    const u = params.unitAmount;
    const asDollars = (u / 100).toFixed(2);
    parts.push(
      `Stripe stores USD in **cents**, not dollars. Your package uses **${u}** cents = **$${asDollars}**. The minimum charge is **50** cents (**$0.50**). So $0.50 is **more** than $${asDollars} — that is why checkout fails even if "35" looks bigger than "0.50" when you read 35 as dollars.`,
    );
    if (u < 100 && u >= 1) {
      parts.push(
        `If you actually meant **$${u}.00** (e.g. thirty-five **dollars**), set **priceCents** to **${u * 100}** (multiply dollars by 100: $35 → 3500), not ${u}.`,
      );
    }
    parts.push(
      `Digits in **stripePriceId** are also cents (\`35\` → 35¢). Use \`3500\` for $35, or a Dashboard **price_...** id.`,
    );
    parts.push(
      `If you use **price_...**, open Stripe Dashboard → Product → Pricing and ensure that price is at least $0.50.`,
    );
  }
  return parts.join(' ');
}
