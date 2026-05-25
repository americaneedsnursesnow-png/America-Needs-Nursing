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
    <section className="relative w-full max-w-none overflow-hidden bg-white">
      {/* 
        IMAGE CONTAINER
        Updated: Mobile view now constrains image height and adjusts by width.
        Desktop remains full-size background.
      */}
      <div className="h-auto max-h-[350px] sm:max-h-[350px] md:max-h-[400px] absolute inset-0 z-0 lg:relative lg:block lg:h-auto lg:max-h-none">
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
      {/* 
        CONTENT WRAPPER
        Updated: Reduced mobile top padding by 10px to bring heading up.
        Heading now positioned 10px higher on mobile view.
      */}
      <div className="relative z-10 flex flex-col justify-center pb-12 pt-40 sm:pb-12 sm:pt-12 lg:absolute lg:inset-0 lg:pb-36 lg:pt-32">
        <SiteContentWrapper>
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-12 xl:gap-16">
            <div className="max-w-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] lg:max-w-none">

              <p className="inline-flex items-center rounded-md bg-button px-4 py-2 text-sm font-semibold text-white shadow-sm">
                {eyebrow}
              </p>
              <h1 className="mt-4 break-words text-3xl font-bold leading-tight tracking-tight text-white xs:text-4xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-6xl">
                {title}
              </h1>
              <p className="hidden md:block mt-5 max-w-lg text-base leading-relaxed text-white/90 sm:text-lg">
                {subtitle}
              </p>

              {/* Stats: 3-column grid to save vertical space */}
              <div className="hidden md:grid mt-10 grid-cols-3 gap-4 sm:max-w-md sm:gap-8">
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