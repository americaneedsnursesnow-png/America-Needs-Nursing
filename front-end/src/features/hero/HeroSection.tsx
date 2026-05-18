import Image from "next/image";

import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { heroContent } from "./content";
import { HeroSearchCard } from "./HeroSearchCard";
import { HeroStatCount } from "./HeroStatCount";


/**
 * Full-width hero: left copy + stats, right search card.
 */
export function HeroSection() {
  const { image, eyebrow, title, subtitle, stats } = heroContent;

  return (
    <section className="relative w-full max-w-none overflow-hidden bg-white">
      {/* 
        IMAGE CONTAINER
        Fixed: On mobile, we use 'absolute' and 'object-cover' so the image 
        stretches to match the height of the content.
      */}
      <div className="absolute inset-x-0 top-0 z-0 h-[min(32vh,260px)] overflow-hidden sm:h-[min(36vh,300px)] lg:relative lg:z-0 lg:block lg:h-auto lg:overflow-visible">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          priority
          fetchPriority="high"
          className="h-full w-full object-cover object-center max-lg:object-[center_24%] lg:h-auto lg:max-w-none lg:object-contain"
          sizes="(max-width: 1024px) 100vw, min(1440px, 96vw)"
        />
        {/* Dark overlay for mobile readability */}
      </div>

      {/* 
        CONTENT WRAPPER
        Fixed: Changed from 'absolute' to 'relative' on mobile. 
        This "pushes" the container height to be as tall as the form and text.
      */}
      <div className="relative z-10 flex flex-col justify-center pb-12 pt-12 sm:pb-12 lg:absolute lg:inset-0 lg:pb-36 lg:pt-32">
        <SiteContentWrapper>
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-12 xl:gap-16">
            <div className="max-w-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] lg:max-w-none">

              <p className="inline-flex items-center rounded-md bg-button px-4 py-2 text-sm font-semibold text-white shadow-sm">
                {eyebrow}
              </p>
              <h1 className="mt-4 break-words text-3xl font-bold leading-tight tracking-tight text-white xs:text-4xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/90 sm:text-lg">
                {subtitle}
              </p>

              {/* Stats: 3-column grid to save vertical space */}
              <div className="mt-10 grid grid-cols-3 gap-4 sm:max-w-md sm:gap-8">
                {stats.map((item, index) => (
                  <div key={item.label}>
                    <p className="text-xl font-bold text-white sm:text-3xl md:text-4xl">
                      <HeroStatCount
                        target={Number(item.digits)}
                        suffix={item.accent}
                        suffixClassName="text-button"
                        delayMs={index * 140}
                      />
                    </p>
                    <p className="mt-1 text-[10px] font-medium uppercase text-white/80 sm:text-sm">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 
              FORM CARD
              Now visible because the 'relative' parent wrapper expands to fit it.
            */}
            <div className="w-full lg:max-w-md lg:justify-self-end xl:max-w-lg">
              <HeroSearchCard />
            </div>
          </div>
        </SiteContentWrapper>
      </div>
    </section>
  );
}