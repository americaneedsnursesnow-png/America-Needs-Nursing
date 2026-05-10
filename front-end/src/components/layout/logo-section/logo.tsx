import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { getAllPublicCompanies } from "@/lib/api/public-api";
import { blogCoverSrc } from "@/lib/blog-cover-image";
import { CompanyLogosCarousel } from "./company-logos-carousel";
import { ShieldCheck } from "lucide-react";

/**
 * Modern, borderless, and seamless employer logos section
 */
export async function LogoSection() {
  let companies: Awaited<ReturnType<typeof getAllPublicCompanies>> = [];
  try {
    companies = await getAllPublicCompanies();
  } catch {
    companies = [];
  }

  // UPDATED: Hide the entire section if there are fewer than 5 companies
  if (!companies || companies.length < 5) {
    return null;
  }

  const items = companies.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    logoSrc: blogCoverSrc(c.logoUrl),
  }));

  return (
   <section className="relative z-0 w-full overflow-hidden bg-white py-10 md:py-12">
      
      {/* Header Container */}
      <SiteContentWrapper className="flex flex-col items-center text-center">
        
        {/* Modern Minimalist Label */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-[1px] w-6 bg-slate-200 hidden sm:block" />
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-slate-400">
            Industry <span className="text-red-600">Leaders</span>
          </span>
          <div className="h-[1px] w-6 bg-slate-200 hidden sm:block" />
        </div>

        {/* Dynamic Subtext - Responsive sizes */}
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
          Trusted by high-growth companies worldwide
        </h2>
      </SiteContentWrapper>

      {/* Carousel Wrapper */}
      <div className="mt-8 md:mt-10 w-full">
        <div className="relative w-full [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
          <CompanyLogosCarousel items={items} />
        </div>
      </div>
    </section>
  );
}