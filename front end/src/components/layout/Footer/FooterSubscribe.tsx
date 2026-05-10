"use client";

import Image from "next/image";

import { FooterBottom } from "./FooterBottom";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import SubscribeForm from "../news-letter/Subscribe-form";

export function FooterSubscribe() {
  return (
    <section
      className="relative w-full overflow-hidden bg-blue-950 py-6 text-center text-white"
      aria-labelledby="footer-subscribe-heading"
    >
      {/* Background Image */}
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden"
        aria-hidden
      >
        <div className="relative h-full min-h-0 w-full">
          <Image
            src="/footer/footer.png"
            alt=""
            fill
            className="object-cover object-bottom"
            sizes="100vw"
          />
        </div>
      </div>
      <SiteContentWrapper>
        <SubscribeForm />
        <FooterBottom />
      </SiteContentWrapper>
    </section>
    
    
  );
}