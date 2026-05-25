import Image from "next/image";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { heroContent } from "./content";
import { HeroSearchCard } from "./HeroSearchCard";

export function HeroSection() {
  const { image, eyebrow, title, subtitle, stats } = heroContent;

  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="absolute left-0 top-0 z-0 h-[560px] w-full lg:inset-0 lg:h-auto">
        <Image
          src="/hero/mobile-hero-section.png"
          alt={image.alt}
          fill
          priority
          className="object-cover object-left-top lg:hidden"
          sizes="100vw"
        />
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          className="hidden object-cover object-center lg:block"
          sizes="100vw"
        />
      </div>

      <div className="relative z-10">
        <SiteContentWrapper>
          <div className="grid min-h-[660px] gap-10 pb-12 pt-40 sm:pt-48 lg:min-h-[720px] lg:grid-cols-2 lg:items-center lg:py-20">
            <div className="max-w-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] lg:max-w-none">
              <p className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm sm:text-sm">
                {eyebrow}
              </p>
              <h1 className="mt-4 break-words text-3xl font-extrabold leading-tight tracking-tight text-white xs:text-4xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-6xl">
                {title}
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base lg:text-lg">
                {subtitle}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-white/20 pt-6 sm:max-w-2xl">
                {stats.map((item) => (
                  <div key={item.label}>
                    <p className="text-sm font-extrabold uppercase tracking-wide text-white sm:text-base">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mb-12 w-full lg:mb-0 lg:max-w-md lg:justify-self-end xl:max-w-lg">
              <div className="overflow-hidden rounded-xl bg-white/95 backdrop-blur-sm p-1 shadow-xl">
                <HeroSearchCard />
              </div>
            </div>
          </div>
        </SiteContentWrapper>
      </div>
    </section>
  );
}