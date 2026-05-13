"use client";

import { siteConfig } from "@/config/site";

export function FooterBottom() {
  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const year = new Date().getFullYear();

  return (
    <div className=" bg-footer  ">
      <div className="flex w-full mt-10 flex-col gap-6 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-sm text-footer-muted sm:text-left">
          © {year}{" "}
          <a
            href={siteConfig.copyrightBrandUrl}
            className="font-semibold text-white underline decoration-white/40 underline-offset-2 transition hover:decoration-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            {siteConfig.copyrightBrand}
          </a>
          . All rights reserved.
        </p>

        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-footer-muted sm:justify-end">
          {siteConfig.stats.map((s) => (
            <li key={s.label} className="whitespace-nowrap">
              <span className="font-semibold text-white">{s.value}</span> {s.label}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={scrollTop}
          className="mx-auto  shrink-0 rounded-md bg-button px-4 py-2 text-sm font-medium text-white transition hover:bg-button-dark focus:outline-none focus:ring-2 focus:ring-button sm:mx-0"
        >
          Back to top
        </button>
      </div>
    </div>
  );
}
