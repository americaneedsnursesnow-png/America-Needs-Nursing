import { spacingFetch } from "./api-request-spacing";
import { getApiBaseUrl, getPublicClientName } from "./env";
import type {
  Paginated,
  PaginatedMeta,
  PublicBlogPost,
  PublicCompany,
  PublicCompanyDetailResponse,
  PublicJob,
} from "./types";

/** Nest may expose `culture_text` / `logo_url` (snake) or camelCase — normalize for the UI. */
function readStr(
  o: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const k of keys) {
    const v = o[k];
    if (v === null || v === undefined) continue;
    if (typeof v === "string") return v;
  }
  return null;
}

function readLocations(
  o: Record<string, unknown>,
): PublicCompany["locations"] {
  const raw = o.locationsJson ?? o.locations_json;
  if (!Array.isArray(raw)) return undefined;
  const out: NonNullable<PublicCompany["locations"]> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = readStr(row, "name");
    if (!name?.trim()) continue;
    out.push({
      name: name.trim(),
      address: readStr(row, "address"),
    });
  }
  return out.length > 0 ? out : undefined;
}

export function normalizePublicCompany(raw: unknown): PublicCompany {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      name: "",
      slug: "",
      logoUrl: null,
      heroImageUrl: null,
      description: null,
      contactEmail: null,
      contactPhone: null,
      cultureText: null,
    };
  }
  const o = raw as Record<string, unknown>;
  return {
    id: String(o.id ?? ""),
    name: String(o.name ?? ""),
    slug: String(o.slug ?? ""),
    logoUrl: readStr(o, "logoUrl", "logo_url"),
    heroImageUrl: readStr(o, "heroImageUrl", "hero_image_url"),
    description: readStr(o, "description"),
    contactEmail: readStr(o, "contactEmail", "contact_email"),
    contactPhone: readStr(o, "contactPhone", "contact_phone"),
    cultureText: readStr(o, "cultureText", "culture_text"),
    partnershipFeatured: Boolean(o.partnershipFeatured ?? o.partnership_featured),
    createdAt: readStr(o, "createdAt", "created_at") ?? undefined,
    locations: readLocations(o),
  };
}

export type JobMapMarker = {
  slug: string;
  title: string;
  stateCode: string | null;
  location: string | null;
};

function readExpiresAt(
  o: Record<string, unknown>,
): string | null {
  const v = o.expiresAt ?? o.expires_at;
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  return null;
}

/** Map Nest `Job` + optional `company` to {@link PublicJob} (snake/camel safe). */
export function normalizePublicJob(raw: unknown): PublicJob {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      title: "",
      slug: "",
      description: "",
      requirements: null,
      location: null,
      stateCode: null,
      featured: false,
      expiresAt: null,
    };
  }
  const o = raw as Record<string, unknown>;
  const companyRaw = o.company;
  return {
    id: String(o.id ?? ""),
    title: String(o.title ?? ""),
    slug: String(o.slug ?? ""),
    description: typeof o.description === "string" ? o.description : "",
    requirements: readStr(o, "requirements"),
    location: readStr(o, "location"),
    employmentType: (o.employmentType ?? o.employment_type) as
      | PublicJob["employmentType"]
      | undefined,
    jobLevel: (o.jobLevel ?? o.job_level) as PublicJob["jobLevel"] | undefined,
    jobCategory: readStr(o, "jobCategory", "job_category"),
    stateCode: readStr(o, "stateCode", "state_code"),
    expectedSalaryRange: readStr(
      o,
      "expectedSalaryRange",
      "expected_salary_range",
    ),
    featured: Boolean(o.featured),
    expiresAt: readExpiresAt(o),
    company:
      companyRaw != null && typeof companyRaw === "object"
        ? normalizePublicCompany(companyRaw)
        : null,
  };
}

function publicQuery(): string {
  const clientName = getPublicClientName();
  return `clientName=${encodeURIComponent(clientName)}`;
}

function emptyMeta(page: number, limit: number): PaginatedMeta {
  return {
    page,
    limit,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

/** Supports new `{ items, meta }` API and legacy plain arrays. */
export function asPaginated<T>(raw: unknown, fallbackPage: number, fallbackLimit: number): Paginated<T> {
  if (Array.isArray(raw)) {
    const items = raw as T[];
    const n = items.length;
    return {
      items,
      meta: {
        page: 1,
        limit: n || fallbackLimit,
        totalItems: n,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }
  if (
    raw &&
    typeof raw === "object" &&
    "items" in raw &&
    "meta" in raw &&
    Array.isArray((raw as Paginated<T>).items) &&
    (raw as Paginated<T>).meta &&
    typeof (raw as Paginated<T>).meta.totalItems === "number"
  ) {
    return raw as Paginated<T>;
  }
  throw new Error("Invalid paginated list response from API");
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}${path.includes("?") ? "&" : "?"}${publicQuery()}`;
  const res = await spacingFetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getPublicJobMapMarkers(
  limit = 400,
): Promise<JobMapMarker[]> {
  const q = `limit=${encodeURIComponent(String(limit))}`;
  const raw = await fetchJson<unknown>(`/public/jobs/map-markers?${q}`, {
    next: { revalidate: 120 },
  });
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const o = row as Record<string, unknown>;
    return {
      slug: String(o.slug ?? ""),
      title: String(o.title ?? ""),
      stateCode: readStr(o, "stateCode", "state_code"),
      location: readStr(o, "location"),
    };
  });
}

export async function getPublicJobs(
  page = 1,
  limit = 24,
): Promise<Paginated<PublicJob>> {
  const q = `page=${encodeURIComponent(String(page))}&limit=${encodeURIComponent(String(limit))}`;
  const raw = await fetchJson<unknown>(`/public/jobs?${q}`, {
    next: { revalidate: 60 },
  });
  const p = asPaginated<PublicJob>(raw, page, limit);
  return {
    ...p,
    items: p.items.map((item) => normalizePublicJob(item as unknown)),
  };
}

export async function getPublicJobBySlug(slug: string): Promise<PublicJob> {
  const raw = await fetchJson<unknown>(
    `/public/jobs/${encodeURIComponent(slug)}`,
    { next: { revalidate: 60 } },
  );
  return normalizePublicJob(raw);
}

export async function getPublicCompanies(
  page = 1,
  limit = 18,
): Promise<Paginated<PublicCompany>> {
  const q = `page=${encodeURIComponent(String(page))}&limit=${encodeURIComponent(String(limit))}`;
  const raw = await fetchJson<unknown>(`/public/companies?${q}`, {
    next: { revalidate: 60 },
  });
  const p = asPaginated<PublicCompany>(raw, page, limit);
  return {
    ...p,
    items: p.items.map((item) => normalizePublicCompany(item as unknown)),
  };
}

/** All approved public companies (for home marquee). Caps pages as a safety guard. */
export async function getAllPublicCompanies(
  maxPages = 30,
): Promise<PublicCompany[]> {
  const pageSize = 100;
  const out: PublicCompany[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await getPublicCompanies(page, pageSize);
    out.push(...batch.items);
    if (!batch.meta.hasNextPage || batch.items.length === 0) {
      break;
    }
  }
  return out;
}

export async function getPublicFeaturedCompanies(
  page = 1,
  limit = 10,
): Promise<Paginated<PublicCompany>> {
  const q = `page=${encodeURIComponent(String(page))}&limit=${encodeURIComponent(String(limit))}`;
  const raw = await fetchJson<unknown>(`/public/companies/featured?${q}`, {
    next: { revalidate: 60 },
  });
  const p = asPaginated<PublicCompany>(raw, page, limit);
  return {
    ...p,
    items: p.items.map((item) => normalizePublicCompany(item as unknown)),
  };
}

export async function getPublicCompanyBySlug(
  slug: string,
  options?: { jobPage?: number; jobLimit?: number },
): Promise<PublicCompanyDetailResponse> {
  const jobPage = options?.jobPage ?? 1;
  const jobLimit = options?.jobLimit ?? 20;
  const q = `jobPage=${encodeURIComponent(String(jobPage))}&jobLimit=${encodeURIComponent(String(jobLimit))}`;
  const body = await fetchJson<{
    company: unknown;
    jobs?: PublicJob[];
    jobsMeta?: PaginatedMeta;
  }>(`/public/companies/${encodeURIComponent(slug)}?${q}`, {
    next: { revalidate: 60 },
  });
  return {
    company: normalizePublicCompany(body.company),
    jobs: (body.jobs ?? []).map((j) => normalizePublicJob(j as unknown)),
    jobsMeta: body.jobsMeta,
  };
}

export async function getPublicBlogPosts(
  page = 1,
  limit = 12,
): Promise<Paginated<PublicBlogPost>> {
  const q = `page=${encodeURIComponent(String(page))}&limit=${encodeURIComponent(String(limit))}`;
  const raw = await fetchJson<unknown>(`/public/blog/posts?${q}`, {
    next: { revalidate: 120 },
  });
  return asPaginated<PublicBlogPost>(raw, page, limit);
}

export async function getPublicBlogPostBySlug(
  slug: string,
): Promise<PublicBlogPost> {
  return fetchJson<PublicBlogPost>(
    `/public/blog/posts/${encodeURIComponent(slug)}`,
    { next: { revalidate: 120 } },
  );
}

/** Public footer / marketing: subscribe email to tenant newsletter list. */
export async function subscribeNewsletterEmail(email: string): Promise<void> {
  const url = `${getApiBaseUrl()}/newsletter/subscribe?${publicQuery()}`;
  const res = await spacingFetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientName: getPublicClientName(),
      email: email.trim(),
    }),
  });
  const text = await res.text().catch(() => "");
  if (res.status === 409) {
    throw new Error("already_subscribed");
  }
  if (!res.ok) {
    throw new Error(text || res.statusText || `Subscribe failed (${res.status})`);
  }
}

export function emptyPaginated<T>(page: number, limit: number): Paginated<T> {
  return { items: [], meta: emptyMeta(page, limit) };
}
