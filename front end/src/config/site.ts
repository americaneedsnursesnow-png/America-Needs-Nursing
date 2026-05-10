/**
 * Central marketing / layout copy. Teams: change branding and links here.
 */
export const siteConfig = {
  name: "America Needs Nurses",
  /** Full brand string (metadata, fallbacks) */
  brandMark: "America Needs Nurses",
  /** Hero card title: America & Nurses = red, Needs = primary blue */
  brandMarkParts: {
    america: "America",
    needs: "Needs",
    nurses: "Nurses",
  },
  logo: {
    src: "/logo/ANN.png",
    alt: "America Needs Nurses",
    width: 450,
    height: 300,
  },
  address: "Collins Street West, Victoria Near Bank Road Australia QHR12456.",
  copyright: "© copyright 2026 by rizitech ",
  
  subscribe: {
    title: "Subscribe to our newsletter",
    description:
      "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
    placeholder: "Enter Your email",
    button: "Subscribe",
  },
  footerColumns: {
    forClients: {
      title: "For Clients",
      links: [
        { label: "Talent Marketplace", href: "/clients/talent" },
        { label: "Payroll Services", href: "/clients/payroll" },
        { label: "Direct Contracts", href: "/clients/contracts" },
        { label: "Hire Worldwide", href: "/clients/worldwide" },
        { label: "Hire in the USA", href: "/clients/usa" },
        { label: "How to Hire", href: "/clients/how-to-hire" },
      ],
    },
    resources: {
      title: "Our Resources",
      links: [
        { label: "Free Business tools", href: "/resources/tools" },
        { label: "Affiliate Program", href: "/resources/affiliate" },
        { label: "Success Stories", href: "/resources/stories" },
        { label: "Upwork Reviews", href: "/resources/reviews" },
        { label: "Resources", href: "/resources" },
        { label: "Help & Support", href: "/support" },
      ],
    },
    jobCategories: {
      title: "Job categories",
      /** `category` values align with hero search & client-side job browse filters. */
      links: [
        { label: "Jobs by state", href: "/jobs/locations" },
        { label: "Critical care (ICU)", href: "/jobs?category=Critical%20care" },
        { label: "Emergency (ED)", href: "/jobs?category=Emergency" },
        { label: "Med-Surg", href: "/jobs?category=Med-Surg" },
        { label: "Operating room (OR)", href: "/jobs?category=Operating%20room" },
        { label: "Pediatrics", href: "/jobs?category=Pediatrics" },
        { label: "Home health", href: "/jobs?category=Home%20health" },
        { label: "Case management", href: "/jobs?category=Case%20management" },
        { label: "Administration", href: "/jobs?category=Administration" },
      ],
    },
  },
  /**
   * Footer / social: push `{ label, href }` rows when marketing shares final URLs.
   * Icons can be wired in `FooterColumns` once this list is non-empty.
   */
  stats: [
    { value: "12K", label: "Job Posted" },
    { value: "10M", label: "Happy Customers" },
    { value: "76K", label: "Freelancers" },
    { value: "200+", label: "Companies" },
  ],
  socials: [
    { label: "Facebook", href: "https://www.facebook.com/americaneednurses", icon: "facebook" },
    { label: "Instagram", href: "https://www.instagram.com/america.needsnurses/", icon: "instagram" },
    { label: "TikTok", href: "https://www.tiktok.com/@america.needs.nurses", icon: "tiktok" },
    { label: "Substack", href: "https://americaneedsnurses.substack.com/publish/home", icon: "substack" },
    { label: "YouTube", href: "https://www.youtube.com/@AmericaNeedsnurses", icon: "youtube" },
  ]
} as const;
