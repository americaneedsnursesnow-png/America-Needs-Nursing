import { authedBlob, authedJson, authedMultipartJson } from "./authed-client";

export type NurseProfileResponse = {
  userId: string;
  clientName: string;
  specialization: string | null;
  licenseNumber: string | null;
  yearsExperience: number | null;
  resumeUrl: string | null;
  communityVerified: boolean;
  city?: string | null;
  stateRegion?: string | null;
  dateOfBirth?: string | null;
  licenseState?: string | null;
  certifications?: string | null;
  /** Rich HTML; optional until backend exposes columns */
  description?: string | null;
  cultureText?: string | null;
  updatedAt: string;
};

export type UpdateNurseProfileBody = {
  specialization?: string | null;
  licenseNumber?: string | null;
  yearsExperience?: number | null;
  city?: string | null;
  stateRegion?: string | null;
  dateOfBirth?: string | null;
  licenseState?: string | null;
  certifications?: string | null;
  description?: string | null;
  cultureText?: string | null;
};

export async function getMyNurseProfile(
  accessToken: string,
): Promise<NurseProfileResponse> {
  return authedJson<NurseProfileResponse>("/nurse-profiles/me", accessToken, {
    method: "GET",
  });
}

export async function patchMyNurseProfile(
  accessToken: string,
  body: UpdateNurseProfileBody,
): Promise<NurseProfileResponse> {
  return authedJson<NurseProfileResponse>("/nurse-profiles/me", accessToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function uploadMyNurseResumePdf(
  accessToken: string,
  file: File,
): Promise<NurseProfileResponse> {
  const form = new FormData();
  form.append("file", file);
  return authedMultipartJson<NurseProfileResponse>(
    "/nurse-profiles/me/resume",
    accessToken,
    form,
  );
}

export async function fetchMyNurseResumePdfBlob(
  accessToken: string,
): Promise<Blob> {
  return authedBlob("/nurse-profiles/me/resume", accessToken, {
    method: "GET",
    headers: { Accept: "application/pdf" },
  });
}

export async function clearMyNurseResume(
  accessToken: string,
): Promise<NurseProfileResponse> {
  return authedJson<NurseProfileResponse>(
    "/nurse-profiles/me/resume",
    accessToken,
    { method: "DELETE" },
  );
}
