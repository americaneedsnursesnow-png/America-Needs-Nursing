/**
 * Shared URL query keys for hero job search → `/jobs` and {@link JobsBrowseWithFilters}.
 */

export type JobBrowseFilters = {
  q: string;
  category: string;
  employment: string;
  experience: string;
  /** US state postal code, e.g. GA */
  state: string;
  /** Expected salary band: `40-60` | `60-90` | `90-120` | `120+` */
  salary: string;
  /** Role keyword matched against job title (RN, LPN, CNA, …). */
  jobTitle: string;
};

export const emptyJobBrowseFilters = (): JobBrowseFilters => ({
  q: "",
  category: "",
  employment: "",
  experience: "",
  state: "",
  salary: "",
  jobTitle: "",
});

export function parseJobBrowseFilters(
  sp: Record<string, string | string[] | undefined>,
): JobBrowseFilters {
  const one = (k: string): string => {
    const v = sp[k];
    if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : "";
    return typeof v === "string" ? v : "";
  };
  return {
    q: one("q"),
    category: one("category"),
    employment: one("employment"),
    experience: one("experience"),
    state: one("state").trim().toUpperCase(),
    salary: one("salary"),
    jobTitle: one("jobTitle"),
  };
}

/** Build query string for `/jobs` (includes `page` when ≥ 2). */
export function buildJobBrowseSearchParams(
  f: JobBrowseFilters,
  page: number,
): string {
  const u = new URLSearchParams();
  if (f.q.trim()) u.set("q", f.q.trim());
  if (f.category.trim()) u.set("category", f.category.trim());
  if (f.employment.trim()) u.set("employment", f.employment.trim());
  if (f.experience.trim()) u.set("experience", f.experience.trim());
  if (f.state.trim()) u.set("state", f.state.trim().toUpperCase());
  if (f.salary.trim()) u.set("salary", f.salary.trim());
  if (f.jobTitle.trim()) u.set("jobTitle", f.jobTitle.trim());
  if (page >= 2) u.set("page", String(page));
  const s = u.toString();
  return s ? `?${s}` : "";
}
