"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { StreakPayLoader } from "@/components/ui/streakpay-loader";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [transitioning, setTransitioning] = useState(false);
  const displayPathRef = useRef(pathname);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      displayPathRef.current = pathname;
      return;
    }

    if (pathname !== displayPathRef.current) {
      setTransitioning(true);
    }
  }, [pathname]);

  const handleComplete = useCallback(() => {
    displayPathRef.current = pathname;
    setTransitioning(false);
  }, [pathname]);

  return (
    <>
      {transitioning && (
        <StreakPayLoader onComplete={handleComplete} />
      )}
      <div style={{ visibility: transitioning ? "hidden" : "visible" }}>
        {children}
      </div>
    </>
  );
}
