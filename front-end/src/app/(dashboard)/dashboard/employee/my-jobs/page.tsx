import { readJwtRole } from "@/lib/auth/jwt-payload";
import { getServerAccessToken } from "@/lib/auth/server-session";
import {
  buildEmployerApplicantCountMap,
  listEmployerJobs,
} from "@/lib/api/jobs-employer-api";
import { listMyApplications, listSavedJobs } from "@/lib/api/nurse-jobs-api";

import MyJobsPageClient, {
  type MyJobsServerPrefetch,
} from "./my-jobs-page-client";

async function loadPrefetch(
  token: string,
  role: ReturnType<typeof readJwtRole>,
): Promise<MyJobsServerPrefetch | undefined> {
  if (role === "nurse") {
    try {
      const [applications, saved] = await Promise.all([
        listMyApplications(token),
        listSavedJobs(token),
      ]);
      return { kind: "nurse", applications, saved };
    } catch {
      return undefined;
    }
  }

  try {
    const jobs = await listEmployerJobs(token);
    const applicantCountByJobId = await buildEmployerApplicantCountMap(
      jobs,
      token,
    );
    return { kind: "company", jobs, applicantCountByJobId };
  } catch {
    try {
      const [applications, saved] = await Promise.all([
        listMyApplications(token),
        listSavedJobs(token),
      ]);
      return { kind: "nurse", applications, saved };
    } catch {
      return undefined;
    }
  }
}

export default async function MyJobsPage() {
  const token = await getServerAccessToken();
  const prefetch =
    token === null ? undefined : await loadPrefetch(token, readJwtRole(token));

  return <MyJobsPageClient prefetch={prefetch} />;
}
