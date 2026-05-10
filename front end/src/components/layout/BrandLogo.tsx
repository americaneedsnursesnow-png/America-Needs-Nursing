"use client";

import Image from "next/image";

import { siteConfig } from "@/config/site";

type BrandLogoImgProps = {
  /** Classes for the white plate wrapper */
  className?: string;
  /** Height-driven sizing; width follows aspect ratio */
  imgClassName?: string;
  priority?: boolean;
};

export function BrandLogoImg({ className = "", imgClassName = "", priority = false }: BrandLogoImgProps) {
  const { logo } = siteConfig;
  return (
    <span
      className={`inline-flex rounded-md px-1 py-1 ${className}`.trim()}
    >
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        className={`h-10 w-auto sm:h-12 ${imgClassName}`.trim()}
        priority={priority}
      />
    </span>
  );
}
