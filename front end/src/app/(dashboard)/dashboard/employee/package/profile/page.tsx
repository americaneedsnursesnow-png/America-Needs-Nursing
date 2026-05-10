"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import {
  createStripeCheckoutSession,
  syncStripeCheckoutSession,
} from "@/lib/api/billing-api";
import { BackendRequestError } from "@/lib/api/authed-client";
import {
  canUseStripeCheckout,
  isStripeCheckoutUsdMinimumError,
  stripeCheckoutMinimumFailureHelp,
  stripeCheckoutUnavailableDetail,
} from "@/lib/stripe-checkout-eligibility";
import {
  type CompanyResponse,
  type JobPackagePurchaseSnapshot,
} from "@/lib/api/company-api";
import { type JobPackageRow } from "@/lib/api/job-packages-api";
import { StripeEmbeddedCheckoutModal } from "@/components/billing/stripe-embedded-checkout-modal";
import { useEmployerDashboardBootstrap } from "@/hooks/use-employer-dashboard-bootstrap";
import { queryKeys } from "@/lib/query-keys";

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function featuredJobsLine(
  featuredLimit: number | undefined,
): string | null {
  const n = featuredLimit ?? 0;
  if (n <= 0) return null;
  return `Up to ${n} featured job${n === 1 ? "" : "s"} at a time (while published).`;
}

function purchaseSnapshotLines(s: JobPackagePurchaseSnapshot): string[] {
  const lines: string[] = [];
  if (s.isUnlimited) lines.push("Unlimited standard job posts (published at once).");
  else {
    lines.push(
      `Up to ${s.publishedJobLimit} standard job post${s.publishedJobLimit === 1 ? "" : "s"} at a time.`,
    );
  }
  const feat = featuredJobsLine(s.featuredJobLimit);
  if (feat) lines.push(feat);
  else lines.push("No featured job slots on this purchase.");
  lines.push(
    `Recorded ${new Date(s.recordedAt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })} (${s.source === "stripe_checkout" ? "Stripe payment" : "Administrator"}).`,
  );
  return lines;
}

function planDescription(
  company: CompanyResponse,
  catalogPkg: JobPackageRow | null | undefined,
): string {
  const pkg =
    company.jobPackage ??
    (catalogPkg && catalogPkg.id === company.jobPackageId ? catalogPkg : null);
  if (pkg?.isUnlimited) return "Unlimited published jobs.";
  if (pkg) {
    return `Up to ${pkg.publishedJobLimit} published job${
      pkg.publishedJobLimit === 1 ? "" : "s"
    } at a time.`;
  }
  if (company.jobPackageExpiresAt) {
    const d = new Date(company.jobPackageExpiresAt);
    if (d <= new Date()) {
      return "Plan expired — you are on the monthly free job post allowance until you buy a new plan.";
    }
  }
  if (company.jobPackageId && company.jobPackagePlanTitle) {
    return "Paid plan — published job limits match your plan. Use Refresh if details just changed.";
  }
  const cap = company.freeTierJobPostsPerMonth ?? 5;
  const used = company.freeTierPublishedCount ?? 0;
  const mm = company.freeTierYyyymm;
  if (mm && /^\d{6}$/.test(mm)) {
    return `No paid plan: ${used} of ${cap} free job post(s) used this month (UTC). Resets on the 1st of next month. Upgrade for higher concurrent limits.`;
  }
  return `No paid plan: up to ${cap} free job post(s) per month (UTC). The count resets on the 1st of each month. Upgrade for higher concurrent limits.`;
}

function PackageProfileSkeleton() {
  return (
    <div className="max-w-7xl space-y-10 px-4 pb-12 pt-10 md:px-6 md:pt-14 animate-pulse">
      <div className="mb-10 h-24 rounded-2xl bg-slate-100" />
      <div className="h-64 rounded-[28px] bg-slate-100" />
      <div className="h-8 w-48 rounded-lg bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((k) => (
          <div key={k} className="h-80 rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

function EmployerPackageProfileInner() {
  const { accessToken, ready, user } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");
  const stripeSessionId = searchParams.get("session_id");

  const {
    data: bootstrap,
    isPending,
    isFetching,
    isError,
    error: bootstrapError,
    refetch,
  } = useEmployerDashboardBootstrap();

  const company = bootstrap?.company ?? null;
  const catalog = bootstrap?.jobPackagesCatalog ?? [];

  const [localError, setLocalError] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState<string | null>(
    null,
  );
  const [showPaymentSuccessBanner, setShowPaymentSuccessBanner] = useState(false);

  const loadError =
    isError && bootstrapError instanceof Error
      ? bootstrapError.message
      : isError
        ? "Could not load plan information."
        : null;

  useEffect(() => {
    if (checkout !== "success") {
      setShowPaymentSuccessBanner(false);
      return;
    }
    setShowPaymentSuccessBanner(true);
    const id = window.setTimeout(() => setShowPaymentSuccessBanner(false), 5000);
    return () => clearTimeout(id);
  }, [checkout]);

  useEffect(() => {
    if (checkout !== "success" || !stripeSessionId?.trim() || !accessToken || !user?.id)
      return;
    let cancelled = false;
    void (async () => {
      try {
        await syncStripeCheckoutSession(accessToken, {
          sessionId: stripeSessionId,
        });
      } catch {
        /* webhook may have applied; user can use Refresh */
      }
      if (cancelled) return;
      await queryClient.invalidateQueries({
        queryKey: queryKeys.employerBootstrap(user.id),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [checkout, stripeSessionId, accessToken, user?.id, queryClient]);

  async function startCheckout(pkg: JobPackageRow) {
    if (!accessToken || !canUseStripeCheckout(pkg)) return;
    setCheckoutId(pkg.id);
    setLocalError(null);
    try {
      const origin = window.location.origin;
      const res = await createStripeCheckoutSession(accessToken, {
        packageId: pkg.id,
        embedded: true,
        successUrl: `${origin}/dashboard/employee/package/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/dashboard/employee/package/profile?checkout=cancel`,
      });
      if ("clientSecret" in res && res.clientSecret) {
        setEmbeddedClientSecret(res.clientSecret);
        setCheckoutId(null);
        return;
      }
      if ("url" in res && res.url) {
        window.location.href = res.url;
        return;
      }
      setLocalError("Checkout did not return an embedded session or redirect URL.");
      setCheckoutId(null);
    } catch (e) {
      if (e instanceof BackendRequestError && isStripeCheckoutUsdMinimumError(e.message)) {
        setLocalError(stripeCheckoutMinimumFailureHelp(pkg));
      } else {
        setLocalError(
          e instanceof BackendRequestError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Checkout could not be started.",
        );
      }
      setCheckoutId(null);
    }
  }

  if (!ready) {
    return <PackageProfileSkeleton />;
  }

  if (!accessToken) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Sign in to manage your job posting plan.
      </div>
    );
  }

  if (isPending) {
    return <PackageProfileSkeleton />;
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-lg rounded-[32px] border border-slate-100 bg-white p-10 text-center shadow-sm">
        <Building2 className="mx-auto mb-4 h-14 w-14 text-slate-300" />
        <h1 className="text-2xl font-black text-slate-900">Company profile required</h1>
        <p className="mt-3 text-slate-600">
          Create your employer company first, then you can choose a plan and pay online when
          Stripe is configured.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-2xl bg-red-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-700"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const currentCatalogPkg = company.jobPackageId
    ? catalog.find((p) => p.id === company.jobPackageId)
    : null;

  return (
    <div className="max-w-7xl space-y-10 px-4 pb-12 pt-10 md:px-6 md:pt-14">
      {embeddedClientSecret ? (
        <StripeEmbeddedCheckoutModal
          clientSecret={embeddedClientSecret}
          onClose={() => {
            setEmbeddedClientSecret(null);
            setCheckoutId(null);
          }}
        />
      ) : null}
      {/* Header Section */}
      <div className="w-full mb-10 pb-8 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
             
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                Account Profile

              </h1>
            </div>
            <p className="text-gray-500 text-lg font-medium">
              Manage your public presence and account security.
            </p>
          </div>
        </div>
      </div>

      {/* Status Banners */}
      {checkout === "success" && showPaymentSuccessBanner && (
        <div
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900"
          role="status"
        >
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <p className="font-medium">
            Payment received. If your plan doesn&apos;t look updated yet, use <strong>Refresh</strong> below.
          </p>
        </div>
      )}
      
      {checkout === "cancel" && (
        <div
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800"
          role="status"
        >
          <XCircle className="h-6 w-6 shrink-0 text-slate-500" />
          <p className="font-medium">Checkout canceled. You can try again anytime.</p>
        </div>
      )}

      {(loadError || localError) && (
        <p
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
          role="alert"
        >
          {localError ?? loadError}
        </p>
      )}

      {/* Current Plan Card */}
      <div className="flex flex-col rounded-[28px] border border-slate-100 bg-white p-5 shadow-md md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Current plan
            </p>
            <h2 className="mt-1 text-xl font-black text-red-600 md:text-2xl">
              {company.jobPackage?.name ??
                company.jobPackagePlanTitle ??
                "Default (free tier)"}
            </h2>
            {isFetching && !isPending && (
              <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
                Updating plan…
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={isFetching}
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/90 p-4 md:p-5">
          {currentCatalogPkg?.description?.trim() && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                About this plan
              </p>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {currentCatalogPkg.description.trim()}
              </p>
            </div>
          )}
          <div className={currentCatalogPkg?.description?.trim() ? "border-t border-slate-200/80 pt-3" : ""}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Your posting limits
            </p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-800 md:text-base">
              {planDescription(company, currentCatalogPkg)}
            </p>
            {company.jobPackageExpiresAt && (
              <p className="mt-3 text-sm text-slate-500">
                Plan ends:{" "}
                {new Date(company.jobPackageExpiresAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
          {company.jobPackagePurchaseSnapshot && (
            <div className="border-t border-slate-200/80 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Your purchase (saved)
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {company.jobPackagePurchaseSnapshot.name}
              </p>
              {company.jobPackagePurchaseSnapshot.description?.trim() && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {company.jobPackagePurchaseSnapshot.description.trim()}
                </p>
              )}
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-slate-700">
                {purchaseSnapshotLines(company.jobPackagePurchaseSnapshot).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                Paid {formatMoney(company.jobPackagePurchaseSnapshot.priceCents, company.jobPackagePurchaseSnapshot.currency)}{" "}
                at purchase.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Catalog Section */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Available plans
        </h3>
        {catalog.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-slate-600">
            No plans are available yet. Your administrator can set them under{" "}
            <strong>Job packages</strong> in the admin dashboard.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {catalog.map((pkg) => {
              const isCurrent = company.jobPackageId === pkg.id;
              const canPay = canUseStripeCheckout(pkg);
              const checkoutDetail = stripeCheckoutUnavailableDetail(pkg);
              const postingLimitLabel = pkg.isUnlimited
                ? "Unlimited published jobs"
                : `${pkg.publishedJobLimit} published job${
                    pkg.publishedJobLimit === 1 ? "" : "s"
                  } at a time`;
              const featuredLine = featuredJobsLine(pkg.featuredJobLimit);
              return (
                <li
                  key={pkg.id}
                  className={`flex min-h-[28rem] min-w-0 flex-col rounded-2xl border p-6 transition md:min-h-[32rem] ${
                    isCurrent
                      ? "border-red-200 bg-red-50/40 ring-2 ring-red-100"
                      : "border-slate-100 bg-white shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="min-w-0 flex-1 break-words text-lg font-bold text-slate-900">
                      {pkg.name}
                    </h4>
                    {isCurrent && (
                      <span className="rounded-lg bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex min-h-[12rem] flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-6 text-center md:min-h-[14rem]">
                    <p className="text-lg font-bold leading-snug text-slate-900 md:text-xl">
                      {postingLimitLabel}
                    </p>
                    {featuredLine ? (
                      <p className="text-sm font-semibold leading-snug text-amber-800">
                        {featuredLine}
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-slate-500">No featured job slots</p>
                    )}
                  </div>
                  <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-2xl font-black text-slate-900">
                    <span className="shrink-0">{formatMoney(pkg.priceCents, pkg.currency)}</span>
                    {pkg.priceCents > 0 ? (
                      <span className="text-sm font-medium text-slate-400">one-time</span>
                    ) : (
                      <span className="text-sm font-medium text-slate-400">free</span>
                    )}
                  </p>
                  <div className="mt-auto pt-6">
                    {canPay ? (
                      <button
                        type="button"
                        disabled={checkoutId === pkg.id}
                        onClick={() => void startCheckout(pkg)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white shadow-md shadow-red-100 transition hover:bg-red-700 disabled:opacity-60"
                      >
                        {checkoutId === pkg.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <CreditCard className="h-5 w-5" />
                        )}
                        Buy with Stripe
                      </button>
                    ) : checkoutDetail ? (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-center text-xs font-medium leading-snug text-amber-950">
                        {checkoutDetail}
                      </p>
                    ) : (
                      <p className="text-center text-sm text-slate-500">
                        Checkout unavailable for this plan—ask an admin to check Job
                        packages (price, Stripe reference, or API checkout rules).
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function EmployerPackageProfilePage() {
  return (
    <Suspense fallback={<PackageProfileSkeleton />}>
      <EmployerPackageProfileInner />
    </Suspense>
  );
}