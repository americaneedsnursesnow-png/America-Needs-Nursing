/** Top header navigation — public marketing routes */
export type MainNavItem = {
  label: string;
  href: string;
  /** Show chevron (dropdown affordance) */
  dropdown?: boolean;
};

export const mainNav: readonly MainNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Find Health Care Talent", href: "/jobs" },
  { label: "Search jobs by state", href: "/jobs/locations" },
  { label: "Free Healthcare listing", href: "/companies" },
  { label: "Media", href: "/blog" },
];
