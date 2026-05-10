/** Shapes returned by GET /public/* (camelCase from Nest/TypeORM entities). */

import type { JobEmploymentType, JobLevel } from "../job-posting-metadata";

/** Pagination envelope from Nest public list routes (`items` + `meta`). */
export interface PaginatedMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginatedMeta;
}

export interface PublicCompany {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  cultureText: string | null;
  /** Multi-site healthcare facilities (from API `locationsJson`). */
  locations?: Array<{ name: string; address?: string | null }>;
  partnershipFeatured?: boolean;
  /** Present on some list endpoints (e.g. featured), ISO string from API. */
  createdAt?: string | null;
}

export interface PublicJob {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  location: string | null;
  employmentType?: JobEmploymentType | null;
  jobLevel?: JobLevel | null;
  jobCategory?: string | null;
  /** Canonical band from employer posting: `40-60` | `60-90` | `90-120` | `120+`. */
  expectedSalaryRange?: string | null;
  /** US state postal code when set by employer (e.g. GA). */
  stateCode?: string | null;
  featured: boolean;
  expiresAt: string | null;
  company?: PublicCompany | null;
}

export interface PublicCompanyDetailResponse {
  company: PublicCompany;
  jobs: PublicJob[];
  /** Present when the API paginates jobs on the company detail route. */
  jobsMeta?: PaginatedMeta;
}

export interface PublicBlogPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  /** Served under `/files/...` on the API (Next rewrites `/files` to Nest when applicable). */
  coverImageUrl?: string | null;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sponsored: boolean;
  publishedAt: string | null;
  /** When the post row was created (for “newest” ordering). */
  createdAt?: string | null;
}
