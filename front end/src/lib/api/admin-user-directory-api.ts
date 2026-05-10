import { authedJson } from "./authed-client";

export type PaginatedMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type Paginated<T> = {
  items: T[];
  meta: PaginatedMeta;
};

/** Public user fields returned on admin list (no password). */
export type AdminDirectoryUser = {
  id: string;
  clientName: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: string;
  profilePhotoUrl?: string | null;
  communityBannedAt?: string | null;
};

export type AdminNurseDirectoryRow = {
  userId: string;
  clientName: string;
  specialization: string | null;
  licenseNumber: string | null;
  yearsExperience: number | null;
  resumeUrl: string | null;
  communityVerified: boolean;
  communityBannedAt: string | null;
  updatedAt: string;
  user: AdminDirectoryUser;
};

export type AdminCompanyDirectoryRow = {
  id: string;
  employerUserId: string;
  clientName: string;
  name: string;
  slug: string;
  contactEmail: string | null;
  contactPhone: string | null;
  cultureText: string | null;
  description: string | null;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
  employer: AdminDirectoryUser | null;
};

const MAX_PAGE = 1_000_000;

/**
 * `GET /nurse-profiles` (admin) — all nurse profiles for this client (paginated, max 100 per page on API).
 */
export async function listNursesForAdmin(
  accessToken: string,
  page: number,
  limit: number = 100,
): Promise<Paginated<AdminNurseDirectoryRow>> {
  const q = new URLSearchParams({
    page: String(Math.min(Math.max(1, page), MAX_PAGE)),
    limit: String(Math.min(100, Math.max(1, limit))),
  });
  return authedJson<Paginated<AdminNurseDirectoryRow>>(
    `/nurse-profiles?${q}`,
    accessToken,
    { method: "GET" },
  );
}

/**
 * `GET /companies` (admin) — all companies (employer accounts) for this client.
 */
export async function listCompaniesForAdmin(
  accessToken: string,
  page: number,
  limit: number = 100,
): Promise<Paginated<AdminCompanyDirectoryRow>> {
  const q = new URLSearchParams({
    page: String(Math.min(Math.max(1, page), MAX_PAGE)),
    limit: String(Math.min(100, Math.max(1, limit))),
  });
  return authedJson<Paginated<AdminCompanyDirectoryRow>>(
    `/companies?${q}`,
    accessToken,
    { method: "GET" },
  );
}

const EXPORT_PAGE = 100;
const MAX_EXPORT_PAGES = 2_000;

/**
 * Fetches all nurse profile rows (paginated API) for CSV export. Stops if page cap exceeded.
 */
export async function fetchAllNursesForAdminExport(
  accessToken: string,
): Promise<AdminNurseDirectoryRow[]> {
  const all: AdminNurseDirectoryRow[] = [];
  let page = 1;
  for (;;) {
    if (page > MAX_EXPORT_PAGES) {
      throw new Error(
        `Export stopped after ${MAX_EXPORT_PAGES} pages (${MAX_EXPORT_PAGES * EXPORT_PAGE} rows). Contact support if you need more.`,
      );
    }
    const r = await listNursesForAdmin(accessToken, page, EXPORT_PAGE);
    all.push(...r.items);
    if (!r.meta.hasNextPage) break;
    page += 1;
  }
  return all;
}

/**
 * Fetches all company rows (paginated API) for CSV export.
 */
export async function fetchAllCompaniesForAdminExport(
  accessToken: string,
): Promise<AdminCompanyDirectoryRow[]> {
  const all: AdminCompanyDirectoryRow[] = [];
  let page = 1;
  for (;;) {
    if (page > MAX_EXPORT_PAGES) {
      throw new Error(
        `Export stopped after ${MAX_EXPORT_PAGES} pages (${MAX_EXPORT_PAGES * EXPORT_PAGE} rows). Contact support if you need more.`,
      );
    }
    const r = await listCompaniesForAdmin(accessToken, page, EXPORT_PAGE);
    all.push(...r.items);
    if (!r.meta.hasNextPage) break;
    page += 1;
  }
  return all;
}
