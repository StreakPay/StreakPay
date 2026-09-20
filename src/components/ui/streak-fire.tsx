import { cn } from "@/lib/utils";

interface StreakFireProps {
  size?: "sm" | "md" | "lg" | "xl";
  active?: boolean;
  className?: string;
}

export function StreakFire({ size = "md", active = true, className }: StreakFireProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        active && "animate-pulse-glow",
        size === "sm" && "text-lg",
        size === "md" && "text-2xl",
        size === "lg" && "text-4xl",
        size === "xl" && "text-6xl",
        className
      )}
      role="img"
      aria-label="Streak fire"
    >
      🔥
    </span>
  );
}
