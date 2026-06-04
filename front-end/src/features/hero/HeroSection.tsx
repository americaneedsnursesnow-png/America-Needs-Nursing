"use client";

import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import {
  ArrowRight,
  Briefcase,
  FileCheck2,
  FileText,
  Globe2,
  HeartHandshake,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { heroContent } from "./content";
import { HeroSearchCard } from "./HeroSearchCard";

const quickLinks = [
  {
    icon: Briefcase,
    title: "Find Jobs",
    description: "Explore top nursing and healthcare jobs across the USA.",
    colorClass: "bg-red-50 text-red-600",
    titleColorClass: "text-red-600",
  },
  {
    icon: UsersRound,
    title: "For Employers",
    description: "Hire qualified nurses and healthcare professionals.",
    colorClass: "bg-blue-50 text-[#001a54]",
    titleColorClass: "text-[#001a54]",
  },
  {
    icon: FileText,
    title: "Nursing Media",
    description: "Stay informed with the latest news, guides, and resources.",
    colorClass: "bg-red-50 text-red-600",
    titleColorClass: "text-red-600",
  },
  {
    icon: HeartHandshake,
    title: "Community",
    description: "Connect, learn, and grow with a strong nursing community.",
    colorClass: "bg-blue-50 text-[#001a54]",
    titleColorClass: "text-[#001a54]",
  },
] as const;

const heroStats = [
  {
    icon: UsersRound,
    value: "200+",
    label: "Healthcare Employers Across the USA",
    mobileLabel: "Employers",
  },
  {
    icon: FileCheck2,
    value: "10K+",
    label: "Jobs Posted Every Month",
    mobileLabel: "Jobs/Month",
  },
  {
    icon: ShieldCheck,
    value: "24/7",
    label: "Recruitment & Support Assistance",
    mobileLabel: "Support",
  },
  {
    icon: Globe2,
    value: "Nationwide",
    label: "Opportunities in All 50 States",
    mobileLabel: "Opportunities",
  },
] as const;

export function HeroSection() {
  const { image, eyebrow, subtitle, searchCard } = heroContent;

  return (
    <section className="relative w-full overflow-hidden bg-white">
      {/* ========================================================================= */}
      {/* DESKTOP VIEW (lg and up)                                                 */}
      {/* ========================================================================= */}
      <div className="hidden lg:block relative w-full pb-14 min-h-[680px] xl:min-h-[720px]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority
            className="object-cover object-[72%_45%]"
            sizes="100vw"
          />
        </div>

          <SiteContentWrapper className="relative z-10 pt-16">
          {/* Main 3-Column Content Grid */}
          <div className="grid grid-cols-[1.5fr_0.7fr_1fr] gap-8 items-start min-h-[520px] xl:min-h-[600px]">
            {/* Column 1: Text Content & Buttons */}
            <div className="pt-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#f3f7ff] px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-[#001a54] shadow-sm ring-1 ring-blue-100/80">
                <Star className="h-3.5 w-3.5 fill-red-600 text-red-600" />
                {eyebrow}
              </p>

              <h1 className="mt-6 max-w-[540px] text-[2.8rem] font-black leading-[1.08] tracking-tight text-[#001a54] xl:text-[3.2rem]">
                America&apos;s
                <span className="block text-red-600 mt-1">
                  HealthCare Career &
                </span>
                <span className="block mt-1">
                  Hiring Network
                </span>
              </h1>

              <p className="mt-6 max-w-[420px] text-sm font-semibold leading-relaxed text-slate-600">
                {subtitle}
              </p>

              <div className="mt-8 flex flex-row gap-4">
                <Link
                  href="/jobs"
                  className="group inline-flex h-[52px] items-center justify-between gap-4 rounded-xl bg-red-600 pl-6 pr-2 text-xs font-black uppercase tracking-wider text-white shadow-[0_12px_24px_rgba(220,38,38,0.18)] transition hover:bg-red-700 active:scale-[0.98] min-w-[170px]"
                >
                  <span>Browse Jobs</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-red-600">
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
                <Link
                  href="/blog"
                  className="group inline-flex h-[52px] items-center justify-between gap-4 rounded-xl border border-gray-250 bg-white pl-6 pr-2 text-xs font-black uppercase tracking-wider text-[#001a54] shadow-[0_12px_24px_rgba(0,0,0,0.02)] transition hover:border-[#001a54]/30 hover:text-red-600 active:scale-[0.98] min-w-[190px]"
                >
                  <span>Explore Resources</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#001a54] text-white">
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Column 2: Empty Spacer for Nurse Image */}
            <div className="relative min-h-[280px]" />

            {/* Column 3: Search Card */}
            <div className="pt-2">
              <HeroSearchCard />
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="relative z-20 mt-8 rounded-[2rem] border border-gray-150 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
            <div className="grid gap-4 lg:grid-cols-4">
              {quickLinks.map((item, index) => (
                <div
                  key={item.title}
                  className={`flex items-center gap-4 px-4 py-4 ${
                    index > 0 ? "lg:border-l lg:border-gray-200" : ""
                  }`}
                >
                  <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${item.colorClass}`}>
                    <item.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-extrabold ${item.titleColorClass}`}>
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="relative z-20 mt-6 overflow-hidden rounded-[2rem] bg-[#0b2559] py-5 px-6 text-white shadow-[0_20px_50px_rgba(11,37,89,0.15)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(220,38,38,0.15),transparent_35%)]" />
            <div className="relative grid gap-3 lg:grid-cols-4">
              {heroStats.map((stat, index) => (
                <div
                  key={stat.value}
                  className={`flex items-center gap-4 px-4 py-4 ${
                    index > 0 ? "lg:border-l lg:border-white/10" : ""
                  }`}
                >
                  <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-white shadow-md ${
                    index % 2 === 0 ? "bg-red-600" : "bg-[#1d4ed8]"
                  }`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black leading-none tracking-tight">
                      {stat.value}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold leading-relaxed text-white/80">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SiteContentWrapper>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW (below lg)                                                   */}
      {/* ========================================================================= */}
      <div className="block lg:hidden relative w-full bg-[#f8fafc] pb-12">
        {/* Top block containing text and nurse background */}
        <div className="relative w-full h-[760px] sm:h-[880px] md:h-[980px] overflow-hidden rounded-b-3xl">
          {/* Full-height background image */}
          <Image
            src="/hero/mobile-hero-section.png"
            alt={image.alt}
            fill
            priority
            className="object-cover object-[74%_center]"
            sizes="100vw"
          />

          {/* Text and buttons overlay */}
          <div className="absolute inset-0 flex flex-col justify-between pt-8 pb-14 px-4">
            <div className="relative z-10 text-left">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[9px] font-extrabold uppercase tracking-wider text-[#001a54] shadow-sm border border-blue-100">
              <Star className="h-3 w-3 fill-red-600 text-red-600" />
              {eyebrow}
            </p>

            <h1 className="mt-5 text-[2.25rem] font-black leading-[1.1] tracking-tight text-[#001a54] sm:text-4xl">
              Connecting You
              <span className="block text-red-600 mt-1">
                To Your Next
              </span>
              <span className="block mt-1">
                Healthcare Career
              </span>
            </h1>

            <p className="mt-4 w-1/2 text-xs font-bold leading-relaxed text-slate-600">
              Connecting Nurses, Healthcare Professionals, and Employers through jobs, media, recruitment, and community.
            </p>

            {/* CTA Buttons on image overlay */}
            <div className="mt-12 flex flex-col gap-3 items-start">
              <Link
                href="/jobs"
                className="group inline-flex h-[50px] items-center justify-between gap-4 rounded-xl bg-red-600 pl-6 pr-2 text-xs font-black uppercase tracking-wider text-white shadow-[0_12px_24px_rgba(220,38,38,0.18)] transition hover:bg-red-700 active:scale-[0.98] w-1/2"
              >
                <span>Browse Jobs</span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-red-600">
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                href="/blog"
                className="group inline-flex h-[50px] items-center justify-between gap-4 rounded-xl border border-gray-250 bg-white pl-6 pr-2 text-xs font-black uppercase tracking-wider text-[#001a54] shadow-[0_12px_24px_rgba(0,0,0,0.02)] transition hover:border-[#001a54]/30 hover:text-red-600 active:scale-[0.98] w-1/2"
              >
                <span>Explore Resources</span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#001a54] text-white">
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
            </div>
          </div>
        </div>

          {/* Stacked mobile contents */}
        <div className="relative z-10 -mt-16 px-4 flex flex-col gap-6 w-full">

          {/* Search Card */}
          <div className="w-full max-w-md mx-auto">
            <HeroSearchCard />
          </div>

          {/* Quick Links Centered Icon Row */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-md mx-auto mt-4 px-1">
            {quickLinks.map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-2.5 text-center">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.04)] ${item.colorClass}`}>
                  <item.icon className="h-5.5 w-5.5" />
                </div>
                <span className="text-[9px] font-extrabold tracking-wider text-[#001a54] leading-tight">
                  {item.title}
                </span>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="w-full max-w-md mx-auto overflow-hidden rounded-[2rem] bg-[#0b2559] py-5 px-4 text-white shadow-lg mt-2">
            <div className="grid grid-cols-4 gap-1 text-center">
              {heroStats.map((stat, index) => (
                <div key={stat.value} className="flex flex-col items-center gap-1.5">
                  <stat.icon className="h-4.5 w-4.5 text-white/90" />
                  <p className="text-[13px] font-black leading-none">
                    {stat.value}
                  </p>
                  <p className="text-[9px] font-bold text-white/70">
                    {stat.mobileLabel}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}