import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SiteContentWrapperProps = {
  children: ReactNode;
  /** Additional classes (e.g. flex layout, vertical padding). */
  className?: string;
};

/**
 * Shared layout shell: centered column that grows with the viewport (fluid max-width)
 * so large monitors don’t show oversized empty gutters, while staying capped for readability.
 */
export function SiteContentWrapper({ children, className }: SiteContentWrapperProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[min(94vw,100rem)] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12",
        className,
      )}
    >
      {children}
    </div>
  );
}
