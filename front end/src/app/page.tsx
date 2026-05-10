import { Suspense } from "react";

import { FeaturedJobs } from "@/components/layout/feature-job";
import { LogoSection } from "@/components/layout/logo-section/index";
import { ProcessSection } from "@/components/layout/process-section/ProcessSection";
import { HeroSection } from "@/features/hero";
import NursePromoBanner from "@/components/layout/nurse-promo/nurse-promo-banner";
import AmericaNeedNursingSection from "@/components/layout/feature-section/feature";
import NewsletterSection from "@/components/layout/news-letter/news-letter";
import { BlogLandingSection } from "@/components/blog/blog-landing-section";
import {
  BlogLandingSectionSkeleton,
  FeaturedJobsSectionSkeleton,
} from "@/components/layout/home-section-skeletons";

export default function HomePage() {
  return (<>
     <HeroSection />

      

      <LogoSection />
      <AmericaNeedNursingSection />
      <Suspense fallback={<FeaturedJobsSectionSkeleton />}>
        <FeaturedJobs />
      </Suspense>

      <ProcessSection />

      <NursePromoBanner />
      <Suspense fallback={<BlogLandingSectionSkeleton />}>
        <BlogLandingSection />
      </Suspense>
      <NewsletterSection />
      </>
  );
}
