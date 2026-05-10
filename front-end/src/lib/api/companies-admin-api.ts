import { authedJson } from "./authed-client";

/** Matches Nest `CompanyApprovalStatus`. */
export type CompanyApprovalStatus =
  | "pending_review"
  | "approved"
  | "rejected";

/** Row from GET /companies/admin/pending (and PATCH approval response). */
export type AdminCompanyRow = {
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
  approvalStatus: CompanyApprovalStatus;
  jobPackageId?: string | null;
  jobPackageExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listPendingCompaniesAdmin(
  accessToken: string,
): Promise<AdminCompanyRow[]> {
  return authedJson<AdminCompanyRow[]>("/companies/admin/pending", accessToken, {
    method: "GET",
  });
}

/**
 * Lists companies by approval state.
 * - `pending_review` → `GET /companies/admin/pending`
 * - `approved` → `GET /companies/admin/accepted` (verified companies)
 * - `rejected` → `GET /companies/admin/rejected`
 */
export async function listCompaniesAdminByStatus(
  accessToken: string,
  approvalStatus: CompanyApprovalStatus,
): Promise<AdminCompanyRow[]> {
  if (approvalStatus === "pending_review") {
    return authedJson<AdminCompanyRow[]>("/companies/admin/pending", accessToken, {
      method: "GET",
    });
  }
  if (approvalStatus === "approved") {
    return authedJson<AdminCompanyRow[]>("/companies/admin/accepted", accessToken, {
      method: "GET",
    });
  }
  return authedJson<AdminCompanyRow[]>("/companies/admin/rejected", accessToken, {
    method: "GET",
  });
}

export async function setCompanyApprovalAdmin(
  accessToken: string,
  companyId: string,
  approvalStatus: CompanyApprovalStatus,
): Promise<AdminCompanyRow> {
  return authedJson<AdminCompanyRow>(
    `/companies/admin/${companyId}/approval`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify({ approvalStatus }),
    },
  );
}

export type SetCompanyJobPackageBody = {
  jobPackageId?: string | null;
  jobPackageExpiresAt?: string | null;
};

export async function setCompanyJobPackageAdmin(
  accessToken: string,
  companyId: string,
  body: SetCompanyJobPackageBody,
): Promise<AdminCompanyRow> {
  return authedJson<AdminCompanyRow>(
    `/companies/admin/${companyId}/job-package`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}
