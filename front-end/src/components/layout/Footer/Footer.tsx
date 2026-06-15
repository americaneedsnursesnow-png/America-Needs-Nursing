"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ChevronDown, ChevronUp } from "lucide-react";
import { siteConfig } from "@/config/site";
import { BrandLogoImg } from "@/components/layout/BrandLogo";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import SubscribeForm from "../news-letter/Subscribe-form";
import { FooterBottom } from "./FooterBottom";

// SVG Icons from the original design
const TikTok = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const FacebookIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const SocialIconRenderer = ({ name }: { name: string }) => {
  const iconName = name.toLowerCase();
  switch (iconName) {
    case "facebook": return <FacebookIcon />;
    case "instagram": return <InstagramIcon />;
    case "youtube": return <YoutubeIcon />;
    case "tiktok": return <TikTok />;
    default: return null;
  }
};

const RedArrow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="6" height="10" viewBox="0 0 6 10" fill="none" className="shrink-0 text-red-600 mt-1">
    <path d="M1 9l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const { footerColumns, socials, address } = siteConfig;

  return (
    <footer className="mt-auto w-full relative bg-white border-t border-gray-100 flex flex-col">
      {/* Background Image Container */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[url('/footer/foother%20mobile.PNG')] bg-cover bg-top bg-no-repeat opacity-[0.95] lg:bg-[url('/footer/footer.png')]" />
      </div>

      {/* Main Footer Content */}
      <div className="relative z-10 py-16 lg:py-20 w-full">
        <SiteContentWrapper>
          {/* Desktop Layout */}
          <div className="hidden lg:grid grid-cols-[1.3fr_0.9fr_1.1fr_0.9fr_1.3fr] gap-8 text-[#001a54]">
            {/* Column 1: Brand block */}
            <div className="flex flex-col gap-5 pr-8 border-r border-gray-200/80">
              <Link href="/" className="inline-flex">
                <BrandLogoImg imgClassName="h-11" className="p-0" />
              </Link>
              
              {/* Star separator line */}
              <div className="flex items-center gap-3 w-full max-w-[200px]">
                <div className="h-[1px] flex-1 bg-gray-300/80" />
                <span className="text-red-600 text-xs select-none">★</span>
                <div className="h-[1px] flex-1 bg-gray-300/80" />
              </div>

              <p className="text-xs font-medium leading-relaxed max-w-[240px] text-[#001a54]/80">
                {address}
              </p>
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-xs font-semibold text-red-600 hover:underline break-all"
              >
                {siteConfig.email}
              </a>

              {/* Social Icons Row */}
              <div className="flex items-center gap-3 mt-1">
                {socials?.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#001a54] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-150 transition hover:scale-105 hover:bg-red-600 hover:text-white"
                    aria-label={social.label}
                  >
                    <SocialIconRenderer name={social.icon} />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Explore */}
            <div className="flex flex-col pr-8 border-r border-gray-200/80">
              <h3 className="text-[13px] font-extrabold uppercase tracking-widest text-[#001a54] mb-3">
                {footerColumns.explore.title}
              </h3>
              <div className="h-[2px] w-6 bg-red-600 mb-6" />
              <ul className="space-y-3.5 text-[13px] font-bold text-[#001a54]/90">
                {footerColumns.explore.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="flex items-start gap-2 hover:text-red-600 transition duration-150">
                      <RedArrow />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Shop by discipline */}
            <div className="flex flex-col pr-8 border-r border-gray-200/80">
              <h3 className="text-[13px] font-extrabold uppercase tracking-widest text-[#001a54] mb-3">
                {footerColumns.jobCategories.title}
              </h3>
              <div className="h-[2px] w-6 bg-red-600 mb-6" />
              <ul className="space-y-3.5 text-[13px] font-bold text-[#001a54]/90">
                {footerColumns.jobCategories.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="flex items-start gap-2 hover:text-red-600 transition duration-150">
                      <RedArrow />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Account & community */}
            <div className="flex flex-col pr-8 border-r border-gray-200/80">
              <h3 className="text-[13px] font-extrabold uppercase tracking-widest text-[#001a54] mb-3">
                {footerColumns.account.title}
              </h3>
              <div className="h-[2px] w-6 bg-red-600 mb-6" />
              <ul className="space-y-3.5 text-[13px] font-bold text-[#001a54]/90">
                {footerColumns.account.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="flex items-start gap-2 hover:text-red-600 transition duration-150">
                      <RedArrow />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 5: Stay connected */}
            <div className="flex flex-col items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_4px_12px_rgba(220,38,38,0.2)]">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#001a54]">
                  STAY CONNECTED
                </h3>
                <p className="mt-2 text-xs font-semibold text-[#001a54]/70 leading-relaxed">
                  Get the latest jobs, news, and resources delivered to your inbox.
                </p>
              </div>
              <div className="w-full mt-1">
                <SubscribeForm variant="footer" />
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="flex lg:hidden flex-col w-full text-[#001a54]">
            {/* Accordions */}
            <div className="flex flex-col border-t border-gray-200/80 mb-8">
              {/* Explore Section */}
              <div className="border-b border-gray-200/80">
                <button
                  onClick={() => toggleSection("explore")}
                  className="flex w-full items-center justify-between py-4 text-xs font-extrabold uppercase tracking-widest text-[#001a54] focus:outline-none"
                >
                  <span>{footerColumns.explore.title}</span>
                  {openSection === "explore" ? (
                    <ChevronUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-red-600" />
                  )}
                </button>
                {openSection === "explore" && (
                  <ul className="pb-4 space-y-3 text-xs font-bold text-[#001a54]/90 animate-in fade-in duration-200">
                    {footerColumns.explore.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="flex items-center gap-2 py-1">
                          <RedArrow />
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Shop Section */}
              <div className="border-b border-gray-200/80">
                <button
                  onClick={() => toggleSection("shop")}
                  className="flex w-full items-center justify-between py-4 text-xs font-extrabold uppercase tracking-widest text-[#001a54] focus:outline-none"
                >
                  <span>{footerColumns.jobCategories.title}</span>
                  {openSection === "shop" ? (
                    <ChevronUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-red-600" />
                  )}
                </button>
                {openSection === "shop" && (
                  <ul className="pb-4 space-y-3 text-xs font-bold text-[#001a54]/90 animate-in fade-in duration-200">
                    {footerColumns.jobCategories.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="flex items-center gap-2 py-1">
                          <RedArrow />
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Account Section */}
              <div className="border-b border-gray-200/80">
                <button
                  onClick={() => toggleSection("account")}
                  className="flex w-full items-center justify-between py-4 text-xs font-extrabold uppercase tracking-widest text-[#001a54] focus:outline-none"
                >
                  <span>{footerColumns.account.title}</span>
                  {openSection === "account" ? (
                    <ChevronUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-red-600" />
                  )}
                </button>
                {openSection === "account" && (
                  <ul className="pb-4 space-y-3 text-xs font-bold text-[#001a54]/90 animate-in fade-in duration-200">
                    {footerColumns.account.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="flex items-center gap-2 py-1">
                          <RedArrow />
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Subscribe Form Center Area */}
            <div className="flex flex-col items-center text-center px-4 max-w-sm mx-auto gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_4px_12px_rgba(220,38,38,0.2)]">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#001a54]">
                  STAY CONNECTED
                </h3>
                <p className="mt-2 text-xs font-semibold text-[#001a54]/70 leading-relaxed">
                  Get the latest jobs, news, and resources delivered to your inbox.
                </p>
              </div>
              <div className="w-full mt-1">
                <SubscribeForm variant="footer" />
              </div>
            </div>

            {/* Social Icons Centered */}
            <div className="flex items-center justify-center gap-4 mt-8">
              {socials?.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#001a54] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-150 transition hover:scale-105 hover:bg-red-600 hover:text-white"
                  aria-label={social.label}
                >
                  <SocialIconRenderer name={social.icon} />
                </a>
              ))}
            </div>
          </div>
        </SiteContentWrapper>
      </div>

      {/* Dark blue bottom footer */}
      <FooterBottom />
    </footer>
  );
}
