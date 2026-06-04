"use client";

import { siteConfig } from "@/config/site";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { ArrowUp } from "lucide-react";

export function FooterBottom() {
  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const year = new Date().getFullYear();
  const brandName = siteConfig.copyrightBrand.toUpperCase();

  return (
    <div className="w-full bg-[#0b2559] py-5 text-white relative z-10">
      <SiteContentWrapper>
        {/* Desktop Layout */}
        <div className="hidden lg:flex w-full items-center justify-between">
          <p className="text-xs font-semibold tracking-wider text-white/95">
            © {year} <a href={siteConfig.copyrightBrandUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{brandName}</a>. ALL RIGHTS RESERVED.
          </p>

          <button
            type="button"
            onClick={scrollTop}
            className="flex items-center gap-2 group transition focus:outline-none"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/60 transition group-hover:bg-white group-hover:text-[#0b2559]">
              <ArrowUp className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold tracking-wider transition group-hover:text-white/80">
              Back to top
            </span>
          </button>
        </div>

        {/* Mobile / Tablet Layout */}
        <div className="flex lg:hidden flex-col items-center gap-4 text-center">
          <div className="text-xs font-bold tracking-widest text-white/95 leading-relaxed">
            <div>© {year} {brandName}.</div>
            <div className="mt-1">ALL RIGHTS RESERVED.</div>
          </div>
          
          <div className="w-full max-w-[280px] h-[1px] bg-white/20" />

          <button
            type="button"
            onClick={scrollTop}
            className="flex items-center gap-2 group transition focus:outline-none"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/60 transition group-hover:bg-white group-hover:text-[#0b2559]">
              <ArrowUp className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-bold tracking-widest transition group-hover:text-white/80">
              Back to top
            </span>
          </button>
        </div>
      </SiteContentWrapper>
    </div>
  );
}

