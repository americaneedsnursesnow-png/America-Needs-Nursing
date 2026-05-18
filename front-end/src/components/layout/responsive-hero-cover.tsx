import Image from "next/image";

type ResponsiveHeroCoverProps = {
  src: string;
  alt: string;
  /**
   * Extra classes on the inner wrapper (`relative h-full w-full` is always applied).
   * Place inside `<div className="absolute inset-0">` under a sized `relative` hero shell.
   */
  wrapperClassName?: string;
  /** When true, marks LCP image (blog/job/company detail heroes). */
  priority?: boolean;
  /**
   * Responsive width hints for `next/image` (used when image optimization is enabled).
   * Mobile-first: phones rarely need &gt; device width; cap desktop hint to limit upscaling.
   */
  sizes?: string;
  /** Applied to the underlying `Image` (object-fit, optional motion). */
  imageClassName?: string;
};

const DEFAULT_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, min(1280px, 100vw)";

/**
 * Full-width hero cover: `fill` + explicit-height parent avoids CLS.
 * With `images.unoptimized` in `next.config.ts`, this still benefits from layout stability
 * and is ready if you later enable the default optimizer + `remotePatterns` for `/files`.
 *
 * Typical usage: wrap in `<div className="absolute inset-0">` inside a `relative` shell
 * that sets the hero height (`h-[30vh]`, `h-52`, etc.).
 */
export function ResponsiveHeroCover({
  src,
  alt,
  wrapperClassName = "",
  priority = false,
  sizes = DEFAULT_SIZES,
  imageClassName = "object-cover object-center",
}: ResponsiveHeroCoverProps) {
  return (
    <div className={`relative h-full w-full min-h-0 ${wrapperClassName}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        fetchPriority={priority ? "high" : "auto"}
        className={imageClassName}
      />
    </div>
  );
}
