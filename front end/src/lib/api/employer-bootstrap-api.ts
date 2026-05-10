import type { AccountMeResponse } from "./account-api";
import type { CompanyResponse } from "./company-api";
import type { JobPackageRow } from "./job-packages-api";
import { authedJson } from "./authed-client";

export type EmployerBootstrapResponse = {
  account: AccountMeResponse;
  company: CompanyResponse | null;
  jobPackagesCatalog: JobPackageRow[];
  notificationsUnreadCount: number;
};

/** Single round-trip: account, company, job package catalog, unread notification count. */
export async function fetchEmployerBootstrap(
  accessToken: string,
): Promise<EmployerBootstrapResponse> {
  return authedJson<EmployerBootstrapResponse>(
    "/account/employer/bootstrap",
    accessToken,
    { method: "GET" },
  );
}
