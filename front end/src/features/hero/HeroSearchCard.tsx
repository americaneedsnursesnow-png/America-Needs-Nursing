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
        className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-600 xs:text-xs"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={`hero-${name}`}
          name={name}
          defaultValue={defaultValue}
          className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs text-black shadow-sm outline-none transition focus:border-button focus:ring-2 focus:ring-button/20 xs:py-2.5 xs:text-sm"
        >
          {options.map((opt) => (
            <option key={`${name}-${opt.value || "__all"}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
    <div className="w-full rounded-2xl border border-white/20 bg-white/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-md sm:p-6 md:p-8 lg:p-10">
      <h2 className="text-center text-base font-bold leading-tight text-button xs:text-lg sm:text-xl md:text-2xl">
        {searchCard.titleBefore}{" "}
        <span className="text-button">{siteConfig.brandMarkParts.america}</span>{" "}
        <span className="text-button">{siteConfig.brandMarkParts.needs}</span>{" "}
        <span className="text-button">{siteConfig.brandMarkParts.nurses}</span>
      </h2>

      <form
        className="mt-6 space-y-4 sm:mt-8 sm:space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const base = emptyJobBrowseFilters();
          const f = {
            ...base,
            q: String(fd.get("q") ?? "").trim(),
            category: String(fd.get("category") ?? "").trim(),
            employment: String(fd.get("employment") ?? "").trim(),
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
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="hero-q"
              type="search"
              name="q"
              placeholder={searchCard.keywordPlaceholder}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-black shadow-sm outline-none placeholder:text-slate-400 focus:border-button focus:ring-2 focus:ring-button/20 sm:h-12 sm:text-base"
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label={s.category.label}
            name={s.category.name}
            options={s.category.options}
          />
          <SelectField label="State" name="state" options={HERO_STATE_OPTIONS} />
          <SelectField
            label={s.jobType.label}
            name={s.jobType.name}
            options={s.jobType.options}
          />
          <SelectField
            label={s.experience.label}
            name={s.experience.name}
            options={s.experience.options}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-button text-sm font-bold text-white transition-all hover:bg-button/90 hover:shadow-lg active:scale-[0.98] sm:h-13 sm:text-base"
        >
          <SearchIcon className="mr-2 h-4 w-4" />
          {searchCard.submitLabel}
        </button>
      </form>
    </div>
  );
}