import type { JobPackageRow } from "@/lib/api/job-packages-api";

/** Stripe Checkout minimum for USD (see Stripe API errors for other currencies). */
export const STRIPE_CHECKOUT_MIN_USD_CENTS = 50;

/**
 * Optional Stripe reference aligned with Nest/API checkout:
 * - **Empty** — backend may use `priceCents` + `price_data` (no Stripe Price ID).
 * - **`price_…`** / **`prod_…`** — Stripe IDs.
 * - **Digits only** — whole number of **cents** (e.g. `3500` = $35.00), never dollars (`37` = $0.37).
 */
export function isAllowedStripePriceReference(value: string): boolean {
  const t = value.trim();
  if (t === "") return true;
  if (/^price_[A-Za-z0-9]+$/.test(t)) return true;
  if (/^prod_[A-Za-z0-9]+$/.test(t)) return true;
  if (/^\d+$/.test(t)) return true;
  return false;
}

function catalogCurrency(pkg: JobPackageRow): string {
  const c = pkg.currency?.trim();
  return (c ? c : "usd").toUpperCase();
}

/** If reference is digits-only, value is interpreted as cents (USD minor units). */
function digitsOnlyAsCents(ref: string): number | null {
  const t = ref.trim();
  if (!/^\d+$/.test(t)) return null;
  return parseInt(t, 10);
}

/** USD: digit refs below 50 are always below Stripe Checkout minimum (and often a dollars/cents mistake). */
function isUsdDigitsBelowStripeMinimum(pkg: JobPackageRow, ref: string): boolean {
  if (catalogCurrency(pkg) !== "USD") return false;
  const cents = digitsOnlyAsCents(ref);
  return cents !== null && cents < STRIPE_CHECKOUT_MIN_USD_CENTS;
}

/**
 * Whether the employer "Buy with Stripe" flow should be offered.
 * Catalog price must be payable; optional `stripePriceId` when API uses price_data.
 */
export function canUseStripeCheckout(pkg: JobPackageRow): boolean {
  if (pkg.priceCents <= 0) return false;
  if (
    catalogCurrency(pkg) === "USD" &&
    pkg.priceCents < STRIPE_CHECKOUT_MIN_USD_CENTS
  ) {
    return false;
  }
  const ref = pkg.stripePriceId?.trim() ?? "";
  if (ref !== "" && !isAllowedStripePriceReference(ref)) return false;
  if (ref !== "" && isUsdDigitsBelowStripeMinimum(pkg, ref)) return false;
  return true;
}

/** User-facing explanation when checkout is not available. */
export function stripeCheckoutUnavailableDetail(pkg: JobPackageRow): string | null {
  const ref = pkg.stripePriceId?.trim() ?? "";
  if (ref !== "" && !isAllowedStripePriceReference(ref)) {
    return (
      `“${ref}” is not a valid checkout reference. Use a Stripe \`price_…\` or \`prod_…\` ID, ` +
      `a whole number of cents (digits only), or leave the field empty so checkout can use your catalog price.`
    );
  }
  if (ref !== "" && isUsdDigitsBelowStripeMinimum(pkg, ref)) {
    const n = digitsOnlyAsCents(ref) ?? 0;
    return (
      `Reference “${ref}” is treated as ${n}¢ ($${(n / 100).toFixed(2)} USD), not $${ref}. ` +
      `Stripe uses cents for USD. For a $35 plan use 3500, or leave empty to use catalog (${(pkg.priceCents / 100).toFixed(2)} USD), or use a \`price_…\` ID. Minimum charge is $0.50.`
    );
  }
  if (pkg.priceCents <= 0) {
    return "This plan is listed as free. Checkout cannot charge $0—set a paid price or assign packages without Stripe.";
  }
  if (
    catalogCurrency(pkg) === "USD" &&
    pkg.priceCents < STRIPE_CHECKOUT_MIN_USD_CENTS
  ) {
    return `Stripe requires at least $0.50 USD per checkout. Raise this package to 50¢ or more in Job packages, or adjust the Stripe Price amount.`;
  }
  return null;
}

/** Stripe API / Nest forwards this when the session total is under the USD minimum. */
export function isStripeCheckoutUsdMinimumError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("total amount due") ||
    (m.includes("at least") && m.includes("0.50") && m.includes("usd"))
  );
}

/** After checkout-session returns 400. */
export function stripeCheckoutMinimumFailureHelp(pkg: JobPackageRow): string {
  const id = pkg.stripePriceId?.trim() ?? "";
  const catalog = `${(pkg.priceCents / 100).toFixed(2)} ${catalogCurrency(pkg)}`;
  if (id !== "" && !isAllowedStripePriceReference(id)) {
    return (
      `Checkout reference “${id}” is not allowed. Use \`price_…\`, \`prod_…\`, digits-only cents, ` +
      `or leave the field empty for catalog-based checkout (price_data).`
    );
  }
  if (id === "") {
    return (
      `Stripe refused checkout: the session total must be at least $0.50 USD. ` +
      `Your catalog shows ${catalog} for “${pkg.name}” with no Stripe reference (price_data path). ` +
      `Ensure the server sends at least $0.50 for USD, or attach a Stripe Price ≥ $0.50.`
    );
  }
  if (/^\d+$/.test(id)) {
    const n = parseInt(id, 10);
    return (
      `Stripe is charging about ${n}¢ ($${(n / 100).toFixed(2)} USD), not $${id}. ` +
      `Stripe’s smallest unit for USD is the cent: \`unit_amount\` / line items use **3500** for **$35.00**, not 35. ` +
      `Your reference “${id}” is far below the $0.50 minimum. Fix: use **${pkg.priceCents}** (matches your catalog), leave the field empty if the API uses catalog cents, or use a Dashboard Price (\`price_…\`).`
    );
  }
  return (
    `Stripe refused checkout: the session total must be at least $0.50 USD. ` +
    `Your catalog shows ${catalog} for “${pkg.name}” with reference \`${id}\`. ` +
    `If this is a Stripe Price, open it in the Dashboard and ensure the amount is ≥ $0.50 USD.`
  );
}
