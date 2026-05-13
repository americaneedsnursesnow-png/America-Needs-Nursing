/** Values accepted by POST/PATCH /jobs (matches Nest `JobEmploymentType` / `JobLevel`). */

export type JobEmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "per_diem"
  | "temporary";

export type JobLevel =
  | "intern"
  | "entry"
  | "mid"
  | "senior"
  | "lead"
  | "executive";

export const EMPLOYMENT_TYPE_OPTIONS: ReadonlyArray<{
  value: JobEmploymentType;
  label: string;
}> = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "per_diem", label: "Per diem" },
  { value: "temporary", label: "Temporary" },
];

export const JOB_LEVEL_OPTIONS: ReadonlyArray<{
  value: JobLevel;
  label: string;
}> = [
  { value: "intern", label: "Intern / student" },
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / charge" },
  { value: "executive", label: "Management / executive" },
];

/** Stored on jobs as `expectedSalaryRange`; same values as hero / jobs browse `salary` filter. */
export const EXPECTED_SALARY_RANGE_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "", label: "Not specified" },
  { value: "40-60", label: "$40k – $60k" },
  { value: "60-90", label: "$60k – $90k" },
  { value: "90-120", label: "$90k – $120k" },
  { value: "120+", label: "$120k+" },
];

/** Salary bands for browse filters (no “not specified” row). */
export const JOB_BROWSE_SALARY_OPTIONS = EXPECTED_SALARY_RANGE_OPTIONS.filter(
  (o) => o.value !== "",
);

/** Browse filter: match discipline tokens (RN, LPN, CNA, …) against job titles. */
export const JOB_TITLE_FILTER_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "", label: "All roles" },
  { value: "RN", label: "RN" },
  { value: "LPN", label: "LPN / LVN" },
  { value: "CNA", label: "CNA" },
  { value: "NP", label: "NP" },
  { value: "PA", label: "PA" },
];

export function jobTitleFilterMatches(jobTitle: string, filter: string): boolean {
  const f = filter.trim();
  if (!f) return true;
  const t = jobTitle.toLowerCase();
  if (f === "LPN") {
    return /\b(lpn|lvn)\b/i.test(jobTitle);
  }
  const token = f.toLowerCase();
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(jobTitle) || t.includes(token);
}

export function expectedSalaryRangeLabel(
  code: string | null | undefined,
): string {
  if (!code?.trim()) return "";
  const hit = EXPECTED_SALARY_RANGE_OPTIONS.find((o) => o.value === code.trim());
  return hit?.label ?? code;
}

export const JOB_CATEGORY_SUGGESTIONS: readonly string[] = [
  "Critical care (ICU)",
  "Emergency (ED)",
  "Med-Surg",
  "Operating room (OR)",
  "Labor & delivery",
  "Pediatrics",
  "Home health",
  "Case management",
  "Administration",
  "Other",
];

export function employmentTypeLabel(
  v: JobEmploymentType | null | undefined,
): string {
  if (!v) return "";
  const hit = EMPLOYMENT_TYPE_OPTIONS.find((o) => o.value === v);
  return hit?.label ?? v;
}

export function jobLevelLabel(v: JobLevel | null | undefined): string {
  if (!v) return "";
  const hit = JOB_LEVEL_OPTIONS.find((o) => o.value === v);
  return hit?.label ?? v;
}

/** Compact subtitle for cards (employment · level · category). */
export function jobListingMetaLine(job: {
  employmentType?: JobEmploymentType | null;
  jobLevel?: JobLevel | null;
  jobCategory?: string | null;
  expectedSalaryRange?: string | null;
}): string | undefined {
  const parts: string[] = [];
  const et = employmentTypeLabel(job.employmentType);
  if (et) parts.push(et);
  const cat = job.jobCategory?.trim();
  if (cat) parts.push(cat);
  const sal = expectedSalaryRangeLabel(job.expectedSalaryRange);
  if (sal) parts.push(sal);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export type JobRoleDetailRow = { label: string; value: string };

/** Label/value rows for cards, apply sidebar, and filters (submit-job parity). */
export function jobRoleDetailEntries(job: {
  jobCategory?: string | null;
  employmentType?: JobEmploymentType | null;
  jobLevel?: JobLevel | null;
  location?: string | null;
  expectedSalaryRange?: string | null;
}): JobRoleDetailRow[] {
  const rows: JobRoleDetailRow[] = [];
  const cat = job.jobCategory?.trim();
  if (cat) rows.push({ label: "Category / specialty", value: cat });
  const et = employmentTypeLabel(job.employmentType);
  if (et) rows.push({ label: "Employment type", value: et });
  const sal = expectedSalaryRangeLabel(job.expectedSalaryRange);
  if (sal) rows.push({ label: "Expected salary", value: sal });
  const loc = job.location?.trim();
  if (loc) rows.push({ label: "Location", value: loc });
  return rows;
}
