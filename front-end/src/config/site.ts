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
  address:
    "1141 Hawthorne Circle, Madison, GA, 30650, USA",
  email: "admin@americaneedsnurses.com",
  /** Footer credit: linked brand name. */
  copyrightBrand: "Arrowhead",
  copyrightBrandUrl: "https://arrowheaddigitech.com",
  subscribe: {
    title: "Subscribe to our newsletter",
    description:
      "Get hiring tips, featured roles, and nurse career resources in your inbox.",
    placeholder: "Email address",
    button: "Subscribe",
  },
  footerColumns: {
    explore: {
      title: "Explore",
      links: [
        { label: "Home", href: "/" },
        { label: "Browse jobs", href: "/jobs" },
        { label: "Search jobs by state", href: "/jobs/locations" },
        { label: "Healthcare employers", href: "/companies" },
        { label: "Blog", href: "/blog" },
        { label: "About Us", href: "/about-us" },
        { label: "Contact Us", href: "/contact-us" },
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms & Conditions", href: "/terms-and-conditions" },
      ],
    },
    jobCategories: {
      title: "Shop by discipline",
      /** `jobTitle` query matches RN, LPN, CNA, NP, PA filters on `/jobs`. */
      links: [
        { label: "Jobs by state", href: "/jobs/locations" },
        { label: "RN roles", href: "/jobs?jobTitle=RN" },
        { label: "LPN / LVN", href: "/jobs?jobTitle=LPN" },
        { label: "CNA roles", href: "/jobs?jobTitle=CNA" },
        { label: "NP roles", href: "/jobs?jobTitle=NP" },
        { label: "PA roles", href: "/jobs?jobTitle=PA" },
        { label: "Critical care (ICU)", href: "/jobs?category=Critical%20care" },
        { label: "Emergency (ED)", href: "/jobs?category=Emergency" },
      ],
    },
    account: {
      title: "Account & community",
      links: [
        { label: "Sign in", href: "/sign-in" },
        { label: "Register", href: "/register" },
        { label: "Community", href: "/community" },
      ],
    },
  },
  stats: [
    { value: "50+", label: "States covered" },
    { value: "24/7", label: "Job search" },
    { value: "100%", label: "Nursing focus" },
    { value: "1", label: "Mission: nurses first" },
  ],
  /** Only networks with a public profile URL (icons rendered in FooterColumns). */
  socials: [
    { label: "Facebook", href: "https://www.facebook.com/americaneednurses", icon: "facebook" },
    { label: "Instagram", href: "https://www.instagram.com/america.needsnurses/", icon: "instagram" },
    { label: "TikTok", href: "https://www.tiktok.com/@america.needs.nurses", icon: "tiktok" },
    { label: "YouTube", href: "https://www.youtube.com/@AmericaNeedsnurses", icon: "youtube" },
  ],
} as const;
