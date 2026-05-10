"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export type CompanyLogoItem = {
  id: string;
  slug: string;
  name: string;
  logoSrc: string | null;
};

const VISIBLE = 6;
const AUTO_MS = 5000;

function chunkBy6(arr: CompanyLogoItem[]): CompanyLogoItem[][] {
  const out: CompanyLogoItem[][] = [];
  for (let i = 0; i < arr.length; i += VISIBLE) {
    out.push(arr.slice(i, i + VISIBLE));
  }
  return out;
}

function LogoMark({ name, logoSrc }: { name: string; logoSrc: string | null }) {
  const letter = name.trim().slice(0, 1).toUpperCase() || "?";
  const logoClasses = "h-auto max-h-8 w-auto max-w-[120px] object-contain transition-all duration-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.3)] md:max-h-12";

  if (logoSrc) {
    return (
      <img
        src={logoSrc}
        alt={name}
        className={logoClasses}
      />
    );
  }
  
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-600 ring-2 ring-red-100 transition-all duration-500 md:h-14 md:w-14">
      {letter}
    </span>
  );
}

export function CompanyLogosCarousel({ items }: { items: CompanyLogoItem[] }) {
  // --- ADDED CONDITION HERE ---
  if (!items || items.length < 5) {
    return null;
  }

  const slides = useMemo(() => chunkBy6(items), [items]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = slides.length;
  const canNav = count > 1;

  const go = useCallback((dir: -1 | 1) => {
    setIndex((i) => (i + dir + count) % count);
  }, [count]);

  useEffect(() => {
    if (!canNav || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [canNav, paused, count]);

  return (
    <div
      className="absolute w-full bg-white py-6" 
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

      {canNav && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full p-1 text-gray-300 transition-all hover:text-red-500 active:scale-90"
          >
            <ChevronLeft size={28} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full p-1 text-gray-300 transition-all hover:text-red-500 active:scale-90"
          >
            <ChevronRight size={28} strokeWidth={1.5} />
          </button>
        </>
      )}

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, slideIdx) => (
            <div key={slideIdx} className="w-full shrink-0 px-12">
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-16">
                {slide.map((c) => (
                  <div key={c.id} className="flex items-center justify-center">
                    <Link
                      href={`/companies/${c.slug}`}
                      className="group flex items-center justify-center transition-transform duration-300 hover:scale-110"
                    >
                      <LogoMark name={c.name} logoSrc={c.logoSrc} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {canNav && (
        <div className="mt-4 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1 transition-all duration-300 rounded-full ${
                i === index ? "w-6 bg-red-500" : "w-1.5 bg-gray-200 hover:bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}