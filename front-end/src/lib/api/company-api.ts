import { authedJson, authedMultipartJson } from "./authed-client";

export type CompanyLocationInput = {
  name: string;
  address?: string | null;
};

export type CreateCompanyBody = {
  name: string;
  slug: string;
  logoUrl?: string;
  heroImageUrl?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  cultureText?: string;
  locations?: CompanyLocationInput[] | null;
};

/** Nested when backend loads `jobPackage` relation (e.g. GET /companies/me). */
export type CompanyJobPackageSummary = {
  id: string;
  name: string;
  publishedJobLimit: number;
  isUnlimited: boolean;
  featuredJobLimit?: number;
  priceCents: number;
  currency: string;
};

/** Frozen at Stripe checkout or admin package assign (`companies.job_package_purchase_snapshot`). */
export type JobPackagePurchaseSnapshot = {
  packageId: string;
  name: string;
  description: string | null;
  publishedJobLimit: number;
  isUnlimited: boolean;
  featuredJobLimit?: number;
  priceCents: number;
  currency: string;
  recordedAt: string;
  source: "stripe_checkout" | "admin";
};

export type CompanyResponse = {
  id: string;
  clientName: string;
  employerUserId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  cultureText: string | null;
  locationsJson?: CompanyLocationInput[] | null;
  approvalStatus: string;
  jobPackageId?: string | null;
  /** Last package id from a successful Stripe checkout (may differ from `jobPackageId` after expiry). */
  lastPurchasedJobPackageId?: string | null;
  /** Snapshot of package name at subscribe / admin assign (see backend `Company.jobPackagePlanTitle`). */
  jobPackagePlanTitle?: string | null;
  jobPackageExpiresAt?: string | null;
  jobPackage?: CompanyJobPackageSummary | null;
  jobPackagePurchaseSnapshot?: JobPackagePurchaseSnapshot | null;
  /** Named subscription window (admin or Stripe plan purchase); paired with `subscriptionExpiresAt`. */
  subscriptionPlanName?: string | null;
  subscriptionExpiresAt?: string | null;
  /**
   * Monthly free publishes (UTC month) when the employer has no active package; from backend `clients` + `companies` counters.
   */
  freeTierYyyymm?: string | null;
  freeTierPublishedCount?: number;
  freeTierJobPostsPerMonth?: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCompanyBody = {
  name?: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  cultureText?: string | null;
  locations?: CompanyLocationInput[] | null;
};

export async function createCompany(
  accessToken: string,
  body: CreateCompanyBody,
): Promise<CompanyResponse> {
  return authedJson<CompanyResponse>("/companies", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMyCompany(
  accessToken: string,
): Promise<CompanyResponse> {
  return authedJson<CompanyResponse>("/companies/me", accessToken, {
    method: "GET",
  });
}

export async function updateMyCompany(
  accessToken: string,
  body: UpdateCompanyBody,
): Promise<CompanyResponse> {
  return authedJson<CompanyResponse>("/companies/me", accessToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** Multipart field `file`. Replaces company logo; returns `{ url }` (e.g. `/files/company-images/logos/...`). */
export async function uploadCompanyLogo(
  accessToken: string,
  file: File,
): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  return authedMultipartJson<{ url: string }>(
    "/companies/me/logo",
    accessToken,
    form,
  );
}

/** Multipart field `file`. Replaces company hero image. */
export async function uploadCompanyHero(
  accessToken: string,
  file: File,
): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  return authedMultipartJson<{ url: string }>(
    "/companies/me/hero",
    accessToken,
    form,
  );
}
