import type { AuthUserRole } from "./auth-api";
import { authedJson, authedMultipartJson } from "./authed-client";

export type AccountMeResponse = {
  id: string;
  clientName: string;
  email: string;
  role: AuthUserRole;
  fullName: string | null;
  profilePhotoUrl?: string | null;
  profileBannerUrl?: string | null;
  /** Rich HTML; optional until backend exposes columns */
  description?: string | null;
  cultureText?: string | null;
  createdAt: string;
  /** Nurses: set when removed from community by an admin. */
  communityBannedAt?: string | null;
};

export type AdminJobPackagePlanSummary = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  active: boolean;
  featuredCompanyListing: boolean;
  featuredJobLimit: number;
  isUnlimited: boolean;
  publishedJobLimit: number;
};

export type AdminCheckoutHistoryItem = {
  sessionId: string;
  createdAt: string;
  amountTotalCents: number | null;
  currency: string | null;
  paymentStatus: string;
  companyId: string | null;
  packageId: string | null;
};

export type AdminDashboardRevenue = {
  stripeConfigured: boolean;
  employerPlans: AdminJobPackagePlanSummary[];
  employersWithActiveSubscription: number;
  employersWithActiveJobPackage: number;
  activeJobPackageCatalogValueCents: number;
  featuredListedJobsTotal: number;
  featuredEmployerProfilesTotal: number;
  recentCheckouts: AdminCheckoutHistoryItem[];
};

export type AdminDashboardStats = {
  nurseTotal: number;
  companyTotal: number;
  listedJobsTotal: number;
  revenue: AdminDashboardRevenue;
};

export type UserDashboardStats = {
  savedJobs: number;
  jobViews: number;
  totalJobs: number;
};

export async function getAdminDashboardStats(
  accessToken: string,
): Promise<AdminDashboardStats> {
  return authedJson<AdminDashboardStats>("/account/admin/dashboard-stats", accessToken, {
    method: "GET",
  });
}

export async function getUserDashboardStats(
  accessToken: string,
): Promise<UserDashboardStats> {
  return authedJson<UserDashboardStats>("/account/me/dashboard-stats", accessToken, {
    method: "GET",
  });
}

export async function getAccountMe(
  accessToken: string,
): Promise<AccountMeResponse> {
  return authedJson<AccountMeResponse>("/account/me", accessToken, {
    method: "GET",
  });
}

export async function patchAccountMe(
  accessToken: string,
  body: {
    fullName?: string | null;
    description?: string | null;
    cultureText?: string | null;
  },
): Promise<AccountMeResponse> {
  return authedJson<AccountMeResponse>("/account/me", accessToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function uploadMyProfilePhoto(
  accessToken: string,
  file: File,
): Promise<AccountMeResponse> {
  const form = new FormData();
  form.append("file", file);
  return authedMultipartJson<AccountMeResponse>(
    "/account/me/photo",
    accessToken,
    form,
  );
}

export async function clearMyProfilePhoto(
  accessToken: string,
): Promise<AccountMeResponse> {
  return authedJson<AccountMeResponse>("/account/me/photo", accessToken, {
    method: "DELETE",
  });
}

export async function uploadMyProfileBanner(
  accessToken: string,
  file: File,
): Promise<AccountMeResponse> {
  const form = new FormData();
  form.append("file", file);
  return authedMultipartJson<AccountMeResponse>(
    "/account/me/banner",
    accessToken,
    form,
  );
}

export async function clearMyProfileBanner(
  accessToken: string,
): Promise<AccountMeResponse> {
  return authedJson<AccountMeResponse>("/account/me/banner", accessToken, {
    method: "DELETE",
  });
}

export async function changeAccountPassword(
  accessToken: string,
  body: { currentPassword: string; newPassword: string },
): Promise<{ ok: true }> {
  return authedJson<{ ok: true }>("/account/change-password", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
