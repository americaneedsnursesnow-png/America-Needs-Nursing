/** Top header navigation — public marketing routes */
export type MainNavItem = {
  label: string;
  href: string;
  /** Show chevron (dropdown affordance) */
  dropdown?: boolean;
};

export const mainNav: readonly MainNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Browse Jobs", href: "/jobs" },
  { label: "Healthcare listing", href: "/companies" },
  { label: "Blogs", href: "/blog" },
];
