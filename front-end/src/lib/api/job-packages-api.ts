import { authedJson } from "./authed-client";

export type JobPackageRow = {
  id: string;
  clientName: string;
  name: string;
  description: string | null;
  publishedJobLimit: number;
  isUnlimited: boolean;
  featuredJobLimit?: number;
  featuredCompanyListing?: boolean;
  priceCents: number;
  currency: string;
  stripePriceId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateJobPackageBody = {
  name: string;
  description?: string;
  isUnlimited?: boolean;
  publishedJobLimit?: number;
  featuredJobLimit?: number;
  featuredCompanyListing?: boolean;
  priceCents: number;
  currency?: string;
  stripePriceId?: string | null;
  active?: boolean;
};

export type UpdateJobPackageBody = {
  name?: string;
  description?: string | null;
  isUnlimited?: boolean;
  publishedJobLimit?: number;
  featuredJobLimit?: number;
  featuredCompanyListing?: boolean;
  priceCents?: number;
  currency?: string;
  stripePriceId?: string | null;
  active?: boolean;
};

/** Employer: active packages for upgrade UI. */
export async function listJobPackagesCatalog(
  accessToken: string,
): Promise<JobPackageRow[]> {
  return authedJson<JobPackageRow[]>("/job-packages/catalog", accessToken, {
    method: "GET",
  });
}

/** Staff: all packages (including inactive). */
export async function listJobPackagesAdmin(
  accessToken: string,
): Promise<JobPackageRow[]> {
  return authedJson<JobPackageRow[]>("/job-packages/admin", accessToken, {
    method: "GET",
  });
}

export async function createJobPackage(
  accessToken: string,
  body: CreateJobPackageBody,
): Promise<JobPackageRow> {
  return authedJson<JobPackageRow>("/job-packages", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateJobPackage(
  accessToken: string,
  id: string,
  body: UpdateJobPackageBody,
): Promise<JobPackageRow> {
  return authedJson<JobPackageRow>(`/job-packages/${id}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
