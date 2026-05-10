"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe, type StripeEmbeddedCheckout } from "@stripe/stripe-js";
import { X } from "lucide-react";

type StripeEmbeddedCheckoutModalProps = {
  clientSecret: string;
  onClose: () => void;
};

/**
 * Stripe Embedded Checkout (iframe) inside a themed shell matching the app (red accent, rounded card).
 */
export function StripeEmbeddedCheckoutModal({
  clientSecret,
  onClose,
}: StripeEmbeddedCheckoutModalProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
    if (!pk) {
      setLoadError(
        "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. Add your Stripe publishable key to .env.local.",
      );
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const stripe = await loadStripe(pk);
        if (!stripe || cancelled) return;

        const checkout = await stripe.initEmbeddedCheckout({
          fetchClientSecret: async () => clientSecret,
        });
        if (cancelled) {
          checkout.destroy();
          return;
        }
        checkoutRef.current = checkout;
        if (mountRef.current) {
          checkout.mount(mountRef.current);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Could not load Stripe Checkout.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      checkoutRef.current?.destroy();
      checkoutRef.current = null;
    };
  }, [clientSecret]);

  function handleClose() {
    checkoutRef.current?.destroy();
    checkoutRef.current = null;
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stripe-embedded-checkout-title"
    >
      <div className="relative flex max-h-[min(92vh,900px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 md:max-w-xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-white">
          <h2
            id="stripe-embedded-checkout-title"
            className="text-sm font-bold tracking-tight md:text-base"
          >
            Secure checkout
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-white/90 transition hover:bg-white/10"
            aria-label="Close checkout"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadError ? (
          <div className="p-6 text-center text-sm text-red-700">{loadError}</div>
        ) : (
          <div className="min-h-[28rem] flex-1 overflow-y-auto bg-slate-50/80 p-3 md:p-4">
            <div
              ref={mountRef}
              className="min-h-[24rem] rounded-xl border border-slate-100 bg-white p-1 shadow-inner"
            />
          </div>
        )}

        <p className="border-t border-slate-100 bg-white px-4 py-2 text-center text-[11px] text-slate-500">
          Payments are processed by Stripe. You may be redirected to your bank to confirm the
          payment.
        </p>
      </div>
    </div>
  );
}
