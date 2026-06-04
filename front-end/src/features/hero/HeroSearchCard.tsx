"use client";

import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";
import { buildJobBrowseSearchParams, emptyJobBrowseFilters } from "@/lib/job-browse-search-params";
import { US_STATES } from "@/lib/us-states";

import { heroContent } from "./content";

const HERO_STATE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "", label: "All states" },
  ...US_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` })),
];

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
}) {
  const defaultValue = options[0]?.value ?? "";
  return (
    <div className="w-full">
      <label
        htmlFor={`hero-${name}`}
        className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[#001a54]/75"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={`hero-${name}`}
          name={name}
          defaultValue={defaultValue}
          className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-gray-250 bg-white pl-4 pr-8 text-xs font-bold text-[#001a54]/90 shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
        >
          {options.map((opt) => (
            <option key={`${name}-${opt.value || "__all"}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

/**
 * White job search panel — matches JobStock-style marketing hero.
 * Submits to `/jobs` with query params consumed by {@link JobsBrowseWithFilters}.
 */
export function HeroSearchCard() {
  const router = useRouter();
  const { searchCard } = heroContent;
  const s = searchCard.selects;

  return (
    <div className="w-full rounded-[2rem] border border-gray-150 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] sm:p-7">
      <h2 className="mx-auto max-w-sm text-center leading-tight">
        <span className="block text-base font-extrabold text-red-600 uppercase tracking-wider">
          {searchCard.titleBefore}
        </span>
        <span className="block mt-1.5 text-xl font-extrabold text-[#001a54]">
          {siteConfig.brandMarkParts.america} {siteConfig.brandMarkParts.needs} {siteConfig.brandMarkParts.nurses}
        </span>
      </h2>

      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const base = emptyJobBrowseFilters();
          const f = {
            ...base,
            q: String(fd.get("q") ?? "").trim(),
            category: String(fd.get("category") ?? "").trim(),
            jobTitle: String(fd.get("jobTitle") ?? "").trim(),
            experience: String(fd.get("experience") ?? "").trim(),
            state: String(fd.get("state") ?? "").trim().toUpperCase(),
          };
          router.push(`/jobs${buildJobBrowseSearchParams(f, 1)}`);
        }}
      >
        {/* Keyword Search Input */}
        <div className="w-full">
          <label htmlFor="hero-q" className="sr-only">
            Search keywords
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-450" />
            <input
              id="hero-q"
              type="search"
              name="q"
              placeholder={searchCard.keywordPlaceholder}
              className="h-12 w-full rounded-xl border border-gray-250 bg-white pl-11 pr-4 text-xs font-bold text-[#001a54] shadow-sm outline-none placeholder:font-semibold placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label={s.category.label}
            name={s.category.name}
            options={s.category.options}
          />
          <SelectField
            label={s.discipline.label}
            name={s.discipline.name}
            options={s.discipline.options}
          />
          <SelectField label="State" name="state" options={HERO_STATE_OPTIONS} />
          <SelectField
            label={s.experience.label}
            name={s.experience.name}
            options={s.experience.options}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-red-600 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(220,38,38,0.18)] transition-all hover:bg-red-700 active:scale-[0.98] focus:outline-none"
        >
          <SearchIcon className="mr-2 h-4 w-4" />
          {searchCard.submitLabel}
        </button>
      </form>
    </div>
  );
}