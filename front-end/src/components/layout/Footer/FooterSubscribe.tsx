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
        className="pointer-events-none absolute inset-y-0 left-1/2 w-full -translate-x-1/2 overflow-hidden"
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
            <div className="mx-auto w-full max-w-3xl">
              <div className="flex flex-col items-center gap-4 text-center text-blue-900">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8m0 8V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" />
                  </svg>
                </div>
                <h2 id="footer-subscribe-heading" className="text-lg font-bold text-blue-900">STAY CONNECTED</h2>
                <p className="max-w-xl text-sm text-footer-muted">Get the latest jobs, news, and resources delivered to your inbox.</p>
              </div>

              <div className="mt-6">
                <SubscribeForm />
              </div>
            </div>

            <FooterBottom />
      </SiteContentWrapper>
    </section>
    
    
  );
}