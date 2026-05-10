import Link from "next/link";
import { BrandLogoImg } from "@/components/layout/BrandLogo";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { siteConfig } from "@/config/site";

// 1. Icon Components
const TikTok = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Substack = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 8H5V5h14v3Z" /><path d="M19 13H5v-3h14v3Z" /><path d="M19 18H5l7-3 7 3Z" />
  </svg>
);

const FacebookIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

// Helper to render the correct SVG based on the name
const SocialIconRenderer = ({ name }: { name: string }) => {
  const iconName = name.toLowerCase();
  switch (iconName) {
    case "facebook": return <FacebookIcon />;
    case "instagram": return <InstagramIcon />;
    case "youtube": return <YoutubeIcon />;
    case "tiktok": return <TikTok />;
    case "substack": return <Substack />;
    default: return null;
  }
};

function BrandBlock() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="inline-flex">
        <BrandLogoImg imgClassName="md:h-12" />
      </Link>
      
      <p className="max-w-xs text-sm leading-relaxed text-footer-muted">
        {siteConfig.address}
      </p>

      {/* Social Icons Row */}
      <div className="flex items-center gap-4 mt-2">
        {siteConfig.socials?.map((social) => (
          <a 
            key={social.label} 
            href={social.href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-footer-muted transition hover:text-white"
            aria-label={social.label}
          >
            <SocialIconRenderer name={social.icon} />
          </a>
        ))}
      </div>
    </div>
  );
}

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-white">{title}</h3>
      <ul className="space-y-3 text-sm text-footer-muted">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FooterColumns({
  activeCategories,
}: {
  activeCategories?: ReadonlyArray<{ label: string; href: string }>;
}) {
  const { footerColumns } = siteConfig;

  const categoryLinks: ReadonlyArray<{ label: string; href: string }> =
    activeCategories && activeCategories.length > 0
      ? activeCategories
      : footerColumns.jobCategories.links;

  return (
    <div className="bg-footer-bg py-14">
      <SiteContentWrapper>
      <div className="grid w-full gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <BrandBlock />

        <LinkColumn
          title={footerColumns.forClients.title}
          links={footerColumns.forClients.links}
        />

        <LinkColumn
          title={footerColumns.jobCategories.title}
          links={categoryLinks}
        />

        <LinkColumn
          title={footerColumns.resources.title}
          links={footerColumns.resources.links}
        />
      </div>
      </SiteContentWrapper>
    </div>
  );
}