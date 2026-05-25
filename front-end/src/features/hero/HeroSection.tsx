import Image from "next/image";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { heroContent } from "./content";
import { HeroSearchCard } from "./HeroSearchCard";
import { HeroStatCount } from "./HeroStatCount";

export function HeroSection() {
  const { image, eyebrow, title, subtitle, stats } = heroContent;

  return (
    <section className="relative w-full bg-slate-50 overflow-hidden">
      
      {/* BACKGROUND IMAGE CONTAINER */}
      <div className="absolute left-0 top-0 h-[500px] w-full lg:h-full">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          // object-top ensures the nurse's face stays visible at the top
          className="object-cover object-top lg:object-center"
          sizes="100vw"
        />
        {/* Subtle overlay to keep text readable without darkening the whole face */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60 lg:bg-gradient-to-r lg:from-black/70 lg:to-transparent" />
      </div>

      {/* CONTENT LAYER */}
      <div className="relative z-10">
        <SiteContentWrapper>
          <div className="flex flex-col lg:grid lg:min-h-[700px] lg:grid-cols-2 lg:items-center lg:gap-10 lg:py-20">
            
            {/* TEXT CONTENT 
                pt-[140px] moves the text/form block up slightly on mobile
            */}
            <div className="flex flex-col pt-[140px] pb-6 text-white sm:pt-[180px] lg:pt-0">
              <div>
                <span className="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm lg:text-xs">
                  {eyebrow}
                </span>
                
                <h1 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-6xl">
                  {title}
                </h1>
                
                <p className="mt-2 max-w-lg text-sm leading-snug text-white/90 sm:text-base lg:text-lg">
                  {subtitle}
                </p>
              </div>
<div className="mt-8 grid grid-cols-2 gap-x-12 gap-y-6 border-t border-white/20 pt-8 sm:max-w-2xl">
  {stats.map((item) => (
    <div key={item.label}>
      <p className="text-xl font-extrabold leading-6 text-white uppercase tracking-wide">
        {item.label}
      </p>
    </div>
  ))}
</div>
            </div>

            {/* FORM CARD 
                The form will naturally follow the text upwards.
            */}
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