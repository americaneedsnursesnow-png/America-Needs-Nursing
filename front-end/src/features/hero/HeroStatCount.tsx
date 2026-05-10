"use client";

import { useEffect, useRef, useState } from "react";

function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
}

type HeroStatCountProps = {
  target: number;
  suffix: string;
  suffixClassName: string;
  durationMs?: number;
  /** Extra wait after the stat enters the viewport (staggered columns) */
  delayMs?: number;
  color?: string;
};

export function HeroStatCount({
  target,
  suffix,
  suffixClassName,
  durationMs = 2200,
  delayMs = 0,
  color = "text-white"
}: HeroStatCountProps) {
  const [value, setValue] = useState(1);
  const containerRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setValue(target);
      return;
    }

    let cancelled = false;

    const run = () => {
      const startVal = 1;
      const startTime = performance.now();

      const tick = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - startTime) / durationMs);
        const eased = easeOutQuart(t);
        const next = Math.round(startVal + (target - startVal) * eased);
        setValue(Math.max(1, next));
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setValue(target);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit) return;
        observer.disconnect();
        delayTimer = setTimeout(() => {
          delayTimer = null;
          run();
        }, delayMs);
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
      if (delayTimer !== null) clearTimeout(delayTimer);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, delayMs]);

  return (
    <span ref={containerRef} className={`inline tabular-nums ${color}`}>
      {value}
      <span className={`${suffixClassName} ${color}`}>{suffix}</span>
    </span>
  );
}
