import { JOB_TITLE_FILTER_OPTIONS } from "@/lib/job-posting-metadata";

/**
 * Home hero — copy, image, stats, and job search card fields.
 * Image: `public/hero/images.jpg` → `/hero/images.jpg`
 */
export const heroContent = {
  image: {
    src: "/hero/images.png" as const,
    alt: "Professional working in a modern office",
    width: 512,
    height: 303,
  },
  eyebrow: "#1 Healthcare Career & Hiring Network in the USA",
  title: "America's HealthCare Career & Hiring Network",
  subtitle:
    "Connecting Nurses, Healthcare Professionals, and Employers through jobs, media, recruitment, and community.",
  stats: [
    { label: "Browse Jobs", href: "/jobs", variant: "primary" },
    { label: "Explore Resources", href: "/blog", variant: "light" },
  ],
  searchCard: {
    titleBefore: "Grow Your Career With ",
    submitLabel: "Search Result",
    keywordPlaceholder: "Search Job Keywords...",
    selects: {
      category: {
        label: "Job Category",
        name: "category" as const,
        /** `value` is sent in the URL and matched against listing category / text. */
        options: [
          { value: "", label: "All categories" },
          { value: "Critical care", label: "Critical care (ICU)" },
          { value: "Emergency", label: "Emergency (ED)" },
          { value: "Med-Surg", label: "Med-Surg" },
          { value: "Operating room", label: "Operating room (OR)" },
          { value: "Pediatrics", label: "Pediatrics" },
          { value: "Home health", label: "Home health" },
          { value: "Case management", label: "Case management" },
          { value: "Administration", label: "Administration" },
        ],
      },
      discipline: {
        label: "Discipline",
        name: "jobTitle" as const,
        /** RN, LPN, CNA, NP, PA — matches `/jobs` sidebar & URL `jobTitle`. */
        options: [...JOB_TITLE_FILTER_OPTIONS],
      },
      experience: {
        label: "Experience",
        name: "experience" as const,
        options: [
          { value: "", label: "Any experience" },
          { value: "1", label: "1+ years" },
          { value: "2", label: "2+ years" },
          { value: "3", label: "3+ years" },
          { value: "5", label: "5+ years" },
        ],
      },
    },
  },
} as const;
