import { authedJson } from "./authed-client";

export type CommunityMemberReportSummary = {
  reportedUserId: string;
  reportedEmail: string;
  reporterCount: number;
  firstReportedAt: string;
  lastReportedAt: string;
};

export async function listCommunityMemberReports(
  accessToken: string,
): Promise<CommunityMemberReportSummary[]> {
  return authedJson<CommunityMemberReportSummary[]>(
    "/community/admin/member-reports",
    accessToken,
    { method: "GET" },
  );
}

export async function banNurseFromCommunity(
  accessToken: string,
  userId: string,
): Promise<{ ok: true }> {
  return authedJson<{ ok: true }>(
    `/community/admin/members/${encodeURIComponent(userId)}/ban-from-community`,
    accessToken,
    { method: "POST" },
  );
}
