import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";

function pulseBar(className: string) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/90 ${className}`}
      aria-hidden
    />
  );
}

/** Shown while RSC data for featured jobs streams in. */
export function FeaturedJobsSectionSkeleton() {
  return (
    <section className="w-full bg-white py-8 md:py-12">
      <SiteContentWrapper>
        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-3">
            {pulseBar("h-4 w-40")}
            {pulseBar("h-10 w-full max-w-md")}
            {pulseBar("h-4 w-full max-w-xl")}
          </div>
          {pulseBar("h-10 w-44 rounded-full")}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-[200px] flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-6"
            >
              {pulseBar("h-5 w-3/4")}
              {pulseBar("h-4 w-1/2")}
              {pulseBar("h-4 w-full")}
              {pulseBar("h-4 w-5/6")}
            </div>
          ))}
        </div>
      </SiteContentWrapper>
    </section>
  );
}

/** Shown while RSC blog list streams in. */
export function BlogLandingSectionSkeleton() {
  return (
    <section className="bg-slate-50 py-16 md:py-20">
      <SiteContentWrapper>
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-3">
            {pulseBar("h-4 w-48")}
            {pulseBar("h-12 w-64 max-w-full")}
          </div>
          {pulseBar("h-10 w-52 rounded-md")}
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-slate-100 bg-white p-4">
                {pulseBar("h-16 w-16 shrink-0 rounded-lg")}
                <div className="flex flex-1 flex-col gap-2">
                  {pulseBar("h-3 w-full")}
                  {pulseBar("h-3 w-4/5")}
                </div>
              </div>
            ))}
          </div>
          <div className="min-h-[280px] rounded-2xl border border-slate-100 bg-white p-6 lg:col-span-1">
            {pulseBar("mb-4 aspect-[16/10] w-full rounded-xl")}
            {pulseBar("mb-2 h-6 w-5/6")}
            {pulseBar("h-4 w-2/3")}
          </div>
          <div className="space-y-4 lg:col-span-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-slate-100 bg-white p-4">
                {pulseBar("h-14 w-14 shrink-0 rounded-lg")}
                <div className="flex flex-1 flex-col gap-2">
                  {pulseBar("h-3 w-full")}
                  {pulseBar("h-3 w-3/4")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SiteContentWrapper>
    </section>
  );
}
