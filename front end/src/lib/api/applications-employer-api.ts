import { authedBlob, authedJson } from "./authed-client";

/** Matches Nest `ApplicationStatus` on job applications. */
export type EmployerApplicationReviewStatus =
  | "pending"
  | "reviewed"
  | "accepted"
  | "rejected";

export type EmployerApplicationRow = {
  id: string;
  clientName: string;
  jobId: string;
  nurseUserId: string;
  status: string;
  coverLetter: string | null;
  createdAt: string;
  updatedAt: string;
  nurse?: {
    id: string;
    email: string;
    fullName?: string | null;
    /** Present when API includes it; `null` means no resume stored. */
    resumeUrl?: string | null;
  };
};

export async function listApplicationsForJob(
  accessToken: string,
  jobId: string,
): Promise<EmployerApplicationRow[]> {
  return authedJson<EmployerApplicationRow[]>(
    `/applications/jobs/${encodeURIComponent(jobId)}`,
    accessToken,
    { method: "GET" },
  );
}

/**
 * Employer updates screening status for an application.
 * Nest: `PATCH /applications/:applicationId/status` with `{ status }`.
 */
export async function updateEmployerApplicationStatus(
  accessToken: string,
  applicationId: string,
  status: EmployerApplicationReviewStatus,
): Promise<EmployerApplicationRow> {
  return authedJson<EmployerApplicationRow>(
    `/applications/${encodeURIComponent(applicationId)}/status`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

/**
 * PDF for the applicant’s resume (same tenant, employer must own the job).
 * Nest: `GET /applications/:applicationId/nurse-resume` → `application/pdf`.
 */
export async function fetchEmployerApplicationNurseResumePdf(
  accessToken: string,
  applicationId: string,
): Promise<Blob> {
  return authedBlob(
    `/applications/${encodeURIComponent(applicationId)}/nurse-resume`,
    accessToken,
    {
      method: "GET",
      headers: { Accept: "application/pdf" },
    },
  );
}
