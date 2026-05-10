import { authedJson, authedVoid } from "./authed-client";
import { listApplicationsForJob } from "./applications-employer-api";
import type { JobEmploymentType, JobLevel } from "../job-posting-metadata";

export type JobStatus = "draft" | "published" | "closed";

export type EmployerJob = {
  id: string;
  clientName: string;
  companyId: string;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  location: string | null;
  stateCode?: string | null;
  employmentType?: JobEmploymentType | null;
  jobLevel?: JobLevel | null;
  jobCategory?: string | null;
  expectedSalaryRange?: string | null;
  status: JobStatus;
  featured: boolean;
  adminReviewRequired: boolean;
  approvedForListing: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Present when API includes counts on `GET /jobs/mine`. */
  applicantCount?: number;
};

export type CreateJobBody = {
  title: string;
  /** Omit to let the API generate a unique slug from the title. */
  slug?: string;
  description: string;
  requirements?: string;
  location?: string;
  /** US state postal code, e.g. GA */
  stateCode?: string;
  employmentType?: JobEmploymentType;
  jobLevel?: JobLevel;
  jobCategory?: string;
  /** `40-60` | `60-90` | `90-120` | `120+` — omit or empty for unspecified. */
  expectedSalaryRange?: string;
};

export type UpdateJobBody = {
  title?: string;
  description?: string;
  requirements?: string | null;
  location?: string | null;
  stateCode?: string | null;
  employmentType?: JobEmploymentType | null;
  jobLevel?: JobLevel | null;
  jobCategory?: string | null;
  expectedSalaryRange?: string | null;
  status?: JobStatus;
};

function pickApplicantCount(row: Record<string, unknown>): number | undefined {
  const v =
    row.applicantCount ??
    row.applicant_count ??
    row.applicationsCount ??
    row.application_count;
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export function attachEmployerJobApplicantCount(raw: unknown): EmployerJob {
  const job = raw as EmployerJob;
  if (!raw || typeof raw !== "object") return job;
  const ac = pickApplicantCount(raw as Record<string, unknown>);
  return ac !== undefined ? { ...job, applicantCount: ac } : job;
}

export async function listEmployerJobs(
  accessToken: string,
): Promise<EmployerJob[]> {
  const rows = await authedJson<unknown[]>("/jobs/mine", accessToken, {
    method: "GET",
  });
  return rows.map((r) => attachEmployerJobApplicantCount(r));
}

/**
 * Batch applicant counts (add on Nest: `GET /jobs/mine/applicant-counts`).
 * Accepts `[{ jobId, count }]` or `{ "job-id": count }`.
 */
export async function listEmployerJobApplicantCounts(
  accessToken: string,
): Promise<Record<string, number>> {
  const raw = await authedJson<unknown>(
    "/jobs/mine/applicant-counts",
    accessToken,
    { method: "GET" },
  );
  if (Array.isArray(raw)) {
    const out: Record<string, number> = {};
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const o = row as Record<string, unknown>;
      const id = o.jobId ?? o.job_id;
      const c = o.count ?? o.applicantCount ?? o.applicant_count;
      if (typeof id === "string" && typeof c === "number") out[id] = c;
    }
    return out;
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const counts = o.counts ?? o.byJobId ?? o.by_job_id;
    if (counts && typeof counts === "object" && !Array.isArray(counts)) {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(counts)) {
        if (typeof v === "number") out[k] = v;
      }
      return out;
    }
  }
  return {};
}

/** Uses per-job counts from list, batch endpoint when available, else parallel per-job fetches. */
export async function buildEmployerApplicantCountMap(
  jobs: EmployerJob[],
  accessToken: string,
): Promise<Record<string, number>> {
  const fromJob: Record<string, number> = {};
  for (const j of jobs) {
    if (j.applicantCount != null) fromJob[j.id] = j.applicantCount;
  }
  const missing = jobs.filter((j) => fromJob[j.id] === undefined);
  if (missing.length === 0) return fromJob;

  try {
    const batch = await listEmployerJobApplicantCounts(accessToken);
    const merged: Record<string, number> = { ...batch, ...fromJob };
    const stillMissing = missing.filter((j) => merged[j.id] === undefined);
    if (stillMissing.length === 0) return merged;
    const pairs = await Promise.all(
      stillMissing.map(async (job) => {
        try {
          const apps = await listApplicationsForJob(accessToken, job.id);
          return [job.id, apps.length] as const;
        } catch {
          return [job.id, 0] as const;
        }
      }),
    );
    return { ...merged, ...Object.fromEntries(pairs) };
  } catch {
    const pairs = await Promise.all(
      missing.map(async (job) => {
        try {
          const apps = await listApplicationsForJob(accessToken, job.id);
          return [job.id, apps.length] as const;
        } catch {
          return [job.id, 0] as const;
        }
      }),
    );
    return { ...fromJob, ...Object.fromEntries(pairs) };
  }
}

export async function createEmployerJob(
  accessToken: string,
  body: CreateJobBody,
): Promise<EmployerJob> {
  const row = await authedJson<unknown>("/jobs", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return attachEmployerJobApplicantCount(row);
}

export async function updateEmployerJob(
  accessToken: string,
  jobId: string,
  body: UpdateJobBody,
): Promise<EmployerJob> {
  const row = await authedJson<unknown>(
    `/jobs/mine/${encodeURIComponent(jobId)}`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return attachEmployerJobApplicantCount(row);
}

export async function deleteEmployerJob(
  accessToken: string,
  jobId: string,
): Promise<void> {
  return authedVoid(
    `/jobs/mine/${encodeURIComponent(jobId)}`,
    accessToken,
    { method: "DELETE" },
  );
}
