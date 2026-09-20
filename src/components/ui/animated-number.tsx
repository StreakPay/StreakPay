"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 800,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationFrame = useRef<number>(0);

  useEffect(() => {
    const start = previousValue.current;
    const end = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = end;
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame.current);
    };
  }, [value, duration]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}
