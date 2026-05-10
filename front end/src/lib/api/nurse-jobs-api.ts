import { authedJson } from "./authed-client";

export type ApplicationStatus = string;

export type NurseApplication = {
  id: string;
  clientName: string;
  jobId: string;
  nurseUserId: string;
  coverLetter: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    title: string;
    slug: string;
    company?: { id: string; name: string; slug: string; logoUrl?: string | null };
  };
};

export type SavedJobRow = {
  id: string;
  nurseUserId: string;
  jobId: string;
  clientName: string;
  createdAt: string;
  job?: {
    id: string;
    title: string;
    slug: string;
    company?: { id: string; name: string; slug: string; logoUrl?: string | null };
  };
};

export async function listMyApplications(
  accessToken: string,
): Promise<NurseApplication[]> {
  return authedJson<NurseApplication[]>("/applications/mine", accessToken, {
    method: "GET",
  });
}

export async function listSavedJobs(
  accessToken: string,
): Promise<SavedJobRow[]> {
  return authedJson<SavedJobRow[]>("/saved-jobs", accessToken, {
    method: "GET",
  });
}
