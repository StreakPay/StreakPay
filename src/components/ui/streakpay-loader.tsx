"use client";

import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const LETTERS = ["S", "T", "R", "E", "A", "K", "P", "A", "Y"];
const LETTER_DELAY_MS = 55;
const TOTAL_MS = LETTERS.length * LETTER_DELAY_MS + 400;

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

interface StreakPayLoaderProps {
  className?: string;
  fullPage?: boolean;
  onComplete?: () => void;
}

export function StreakPayLoader({ className, fullPage = true, onComplete }: StreakPayLoaderProps) {
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      onComplete?.();
      return;
    }
    const t = setTimeout(() => onComplete?.(), TOTAL_MS);
    return () => clearTimeout(t);
  }, [prefersReduced, onComplete]);

  return (
    <div
      className={cn(
        fullPage && "fixed inset-0 z-[100] flex items-center justify-center bg-background",
        !fullPage && "flex items-center justify-center py-8",
        className
      )}
    >
      <div className="relative flex items-center">
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className={cn(
              "streakpay-letter text-3xl md:text-4xl font-bold tracking-[0.2em]",
              prefersReduced && "streakpay-letter-reduced"
            )}
            style={{
              animationDelay: prefersReduced ? "0ms" : `${i * LETTER_DELAY_MS}ms`,
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
