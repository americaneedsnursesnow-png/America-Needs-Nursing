import { authedJson } from "./authed-client";

export type ApplyJobBody = {
  coverLetter?: string;
};

export async function applyToJob(
  accessToken: string,
  jobId: string,
  body?: ApplyJobBody,
): Promise<unknown> {
  return authedJson(`/applications/jobs/${encodeURIComponent(jobId)}`, accessToken, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}
