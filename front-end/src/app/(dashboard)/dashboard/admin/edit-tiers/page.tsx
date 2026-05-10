"use client";

import React, { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Edit3,
  Layers,
  Loader2,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { BackendRequestError } from "@/lib/api/authed-client";
import { isFullOpsAdmin, type AuthUserRole } from "@/lib/api/auth-api";
import {
  createJobPackage,
  listJobPackagesAdmin,
  updateJobPackage,
  type JobPackageRow,
} from "@/lib/api/job-packages-api";
import {
  getClientPlatformSettings,
  updateClientPlatformSettings,
} from "@/lib/api/clients-api";
import {
  isAllowedStripePriceReference,
  STRIPE_CHECKOUT_MIN_USD_CENTS,
} from "@/lib/stripe-checkout-eligibility";

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

type FormState = {
  name: string;
  description: string;
  isUnlimited: boolean;
  publishedJobLimit: string;
  featuredJobLimit: string;
  featuredCompanyListing: boolean;
  priceDollars: string;
  currency: string;
  stripePriceId: string;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  isUnlimited: false,
  publishedJobLimit: "1",
  featuredJobLimit: "0",
  featuredCompanyListing: false,
  priceDollars: "0",
  currency: "usd",
  stripePriceId: "",
  active: true,
};

function packageToForm(pkg: JobPackageRow): FormState {
  return {
    name: pkg.name,
    description: pkg.description ?? "",
    isUnlimited: pkg.isUnlimited,
    publishedJobLimit: String(pkg.publishedJobLimit),
    featuredJobLimit: String(pkg.featuredJobLimit ?? 0),
    featuredCompanyListing: pkg.featuredCompanyListing === true,
    priceDollars: (pkg.priceCents / 100).toFixed(2),
    currency: pkg.currency,
    stripePriceId: pkg.stripePriceId ?? "",
    active: pkg.active,
  };
}

function canManagePackages(role: AuthUserRole | undefined): boolean {
  return role !== undefined && isFullOpsAdmin(role);
}

export default function JobPackagesAdminPage() {
  const { accessToken, ready, user } = useAuth();
  const staff = canManagePackages(user?.role);

  const [packages, setPackages] = useState<JobPackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View state: 'list' or 'edit'
  const [view, setView] = useState<"list" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [freeTierCap, setFreeTierCap] = useState(5);
  const [freeTierInput, setFreeTierInput] = useState("5");
  const [freeTierSaving, setFreeTierSaving] = useState(false);
  const [freeTierError, setFreeTierError] = useState<string | null>(null);
  const [freeTierOk, setFreeTierOk] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || !staff) return;
    setLoading(true);
    setError(null);
    setFreeTierError(null);
    try {
      const [list, freeSettings] = await Promise.all([
        listJobPackagesAdmin(accessToken),
        getClientPlatformSettings(accessToken),
      ]);
      setPackages(list);
      setFreeTierCap(freeSettings.freeTierJobPostsPerMonth);
      setFreeTierInput(String(freeSettings.freeTierJobPostsPerMonth));
    } catch (e) {
      setError(e instanceof BackendRequestError ? e.message : "Could not load packages.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, staff]);

  async function saveFreeTier(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setFreeTierSaving(true);
    setFreeTierError(null);
    setFreeTierOk(false);
    const n = parseInt(freeTierInput.trim(), 10);
    if (Number.isNaN(n) || n < 0 || n > 999) {
      setFreeTierError("Enter a whole number from 0 to 999.");
      setFreeTierSaving(false);
      return;
    }
    try {
      const s = await updateClientPlatformSettings(accessToken, {
        freeTierJobPostsPerMonth: n,
      });
      setFreeTierCap(s.freeTierJobPostsPerMonth);
      setFreeTierInput(String(s.freeTierJobPostsPerMonth));
      setFreeTierOk(true);
      window.setTimeout(() => setFreeTierOk(false), 3000);
    } catch (err) {
      setFreeTierError(
        err instanceof BackendRequestError
          ? err.message
          : "Could not save free tier limit.",
      );
    } finally {
      setFreeTierSaving(false);
    }
  }

  useEffect(() => {
    if (ready && accessToken && staff) void load();
  }, [ready, accessToken, staff, load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setView("edit");
    setError(null);
    window.scrollTo(0, 0);
  }

  function openEdit(pkg: JobPackageRow) {
    setEditingId(pkg.id);
    setForm(packageToForm(pkg));
    setView("edit");
    setError(null);
    window.scrollTo(0, 0);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    const limit = parseInt(form.publishedJobLimit, 10);
    const featuredLimit = parseInt(form.featuredJobLimit, 10);
    const price = parseFloat(form.priceDollars);

    if (!form.isUnlimited && (Number.isNaN(limit) || limit < 1)) {
      setError("Published job limit must be at least 1.");
      return;
    }
    
    const priceCents = Math.round(price * 100);
    const stripeId = form.stripePriceId.trim();

    if (stripeId && priceCents <= 0) {
      setError("Free packages cannot use a Stripe price ID.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        isUnlimited: form.isUnlimited,
        publishedJobLimit: form.isUnlimited ? undefined : limit,
        featuredJobLimit: featuredLimit,
        featuredCompanyListing: form.featuredCompanyListing,
        priceCents,
        currency: form.currency.trim().toLowerCase() || "usd",
        stripePriceId: stripeId || null,
        active: form.active,
      };

      if (editingId) {
        await updateJobPackage(accessToken, editingId, payload);
      } else {
        await createJobPackage(accessToken, payload);
      }
      setView("list");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!staff) {
    return <div className="p-8">Access Denied.</div>;
  }

  // --- RENDERING FORM VIEW ---
  if (view === "edit") {
    return (
      <div className="w-full px-12 py-8 md:py-10 lg:py-12 ">
        <button
          onClick={() => setView("list")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-red-600"
        >
          <ArrowLeft size={16} /> Back to packages
        </button>

        <div className="mb-8">
          <h1 className="sm:text-3xl lg:text-4xl text-2xl font-black text-slate-900">
            {editingId ? "Edit Tier" : "Create New Tier"}
          </h1>
          <p className="text-slate-500">Configure the pricing, limits, and visibility of this package.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-8">
          {/* Section: Basic Info */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
              <Settings2 className="text-red-500" size={20} />
              <h2 className="font-bold text-slate-900">General Information</h2>
            </div>
            <div className="grid gap-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Package Name</label>
                <input
                  required
                  placeholder="e.g. Enterprise Monthly"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="What's included in this tier?"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <input
                  type="checkbox"
                  id="active"
                  className="h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                <label htmlFor="active" className="text-sm font-bold text-slate-700 cursor-pointer">
                  Visible in Catalog (Active)
                </label>
              </div>
            </div>
          </section>

          {/* Section: Limits */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
              <Zap className="text-amber-500" size={20} />
              <h2 className="font-bold text-slate-900">Job Posting Limits</h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="unlimited"
                  className="h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  checked={form.isUnlimited}
                  onChange={(e) => setForm((f) => ({ ...f, isUnlimited: e.target.checked }))}
                />
                <label htmlFor="unlimited" className="text-sm font-bold text-slate-700 cursor-pointer">
                  Unlimited Published Jobs
                </label>
              </div>

              {!form.isUnlimited && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Max Published Jobs</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      value={form.publishedJobLimit}
                      onChange={(e) => setForm((f) => ({ ...f, publishedJobLimit: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Featured Job Slots</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    value={form.featuredJobLimit}
                    onChange={(e) => setForm((f) => ({ ...f, featuredJobLimit: e.target.value }))}
                  />
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-red-600"
                      checked={form.featuredCompanyListing}
                      onChange={(e) => setForm((f) => ({ ...f, featuredCompanyListing: e.target.checked }))}
                    />
                    <span className="text-sm font-bold text-slate-700">Featured Company Directory</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Pricing */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
              <CreditCard className="text-blue-500" size={20} />
              <h2 className="font-bold text-slate-900">Pricing & Checkout</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  value={form.priceDollars}
                  onChange={(e) => setForm((f) => ({ ...f, priceDollars: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Stripe Price ID</label>
                <input
                  placeholder="price_..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm"
                  value={form.stripePriceId}
                  onChange={(e) => setForm((f) => ({ ...f, stripePriceId: e.target.value }))}
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={() => setView("list")}
              className="flex-1 rounded-2xl border border-slate-200 py-4 font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 font-bold text-white shadow-xl transition hover:bg-red-800 disabled:opacity-80"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save size={18} />}
              Save Package Configuration
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- RENDERING LIST VIEW ---
  return (
    <div className="w-full px-12 py-8 md:py-10 lg:py-12 ">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
         
          <h1 className="text-3xl font-black tracking-tight  sm:text-3xl">
            Tiers & Packages
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-500">
            Manage your subscription levels, job limits, and Stripe pricing triggers for employers.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-8 py-4 font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={20} />
          Create New Tier
        </button>
      </div>

      <section className="mb-10 rounded-[32px] border border-red-200/80 bg-amber-50/40 p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
              Free job posts (no package)
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Employers without an active job package can publish this many jobs per <strong>UTC calendar month</strong> (resets on the 1st). Set to 0 to require a package for every post.
            </p>
          </div>
        </div>
        {freeTierError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {freeTierError}
          </div>
        )}
        {freeTierOk && (
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} /> Saved free tier limit.
          </div>
        )}
        <form onSubmit={saveFreeTier} className="flex max-w-md flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="free-tier-monthly" className="mb-1 block text-xs font-bold text-slate-500">
              Free posts per month (current: {freeTierCap})
            </label>
            <input
              id="free-tier-monthly"
              type="number"
              min={0}
              max={999}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-red-500/30"
              value={freeTierInput}
              onChange={(e) => setFreeTierInput(e.target.value)}
              disabled={freeTierSaving || loading}
            />
          </div>
          <button
            type="submit"
            disabled={freeTierSaving || loading}
            className="shrink-0 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-50"
          >
            {freeTierSaving ? "Saving…" : "Save limit"}
          </button>
        </form>
      </section>

      {loading ? (
        <div className="flex py-20 justify-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>
      ) : packages.length === 0 ? (
        <div className="rounded-[40px] border-2 border-dashed border-slate-200 py-32 text-center">
          <Layers className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-xl font-medium text-slate-500">No packages configured yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`group relative flex flex-col rounded-[32px] border bg-white p-8 transition-all hover:shadow-xl ${
                pkg.active ? "border-red-100" : "border-red-600 bg-slate-50/50 grayscale-[0.5]"
              }`}
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-[10px] font-black text-slate-900">{pkg.name}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    {pkg.active ? (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Live
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Draft</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openEdit(pkg)}
                  className="rounded-2xl bg-slate-100 p-3 text-slate-600 transition group-hover:bg-red-600 group-hover:text-white"
                >
                  <Edit3 size={18} />
                </button>
              </div>

              <div className="mb-6 flex-1">
                <p className="mb-6 text-sm leading-relaxed text-slate-500">
                  {pkg.description || "No description provided."}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm font-medium text-red-600">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    {pkg.isUnlimited ? "Unlimited Posts" : `${pkg.publishedJobLimit} Job Slots`}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-red-600">
                    <CheckCircle2 size={16} className={pkg.featuredJobLimit ? "text-emerald-500" : "text-slate-300"} />
                    {pkg.featuredJobLimit || 0} Featured Slots
                  </li>
                </ul>
              </div>

              <div className="mt-auto border-t border-slate-50 pt-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl  text-red-600">
                    {formatMoney(pkg.priceCents, pkg.currency)}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-red-600 truncate">
                  ID: {pkg.stripePriceId || "MANUAL_ONLY"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}