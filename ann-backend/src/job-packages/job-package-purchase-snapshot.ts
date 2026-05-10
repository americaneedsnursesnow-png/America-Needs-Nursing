import type { JobPackage } from '../database/entities/job-package.entity';

/** Persisted on `companies.job_package_purchase_snapshot` after checkout or admin assign. */
export type JobPackagePurchaseSnapshot = {
  packageId: string;
  name: string;
  description: string | null;
  publishedJobLimit: number;
  isUnlimited: boolean;
  featuredJobLimit: number;
  priceCents: number;
  currency: string;
  recordedAt: string;
  source: 'stripe_checkout' | 'admin';
};

export function buildJobPackagePurchaseSnapshot(
  pkg: JobPackage,
  recordedAt: Date,
  source: JobPackagePurchaseSnapshot['source'],
): JobPackagePurchaseSnapshot {
  return {
    packageId: pkg.id,
    name: pkg.name,
    description: pkg.description,
    publishedJobLimit: pkg.publishedJobLimit,
    isUnlimited: pkg.isUnlimited,
    featuredJobLimit: pkg.featuredJobLimit,
    priceCents: pkg.priceCents,
    currency: pkg.currency,
    recordedAt: recordedAt.toISOString(),
    source,
  };
}
