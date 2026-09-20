"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "subtle" | "strong";
  hover?: boolean;
  glow?: "accent" | "gold" | "orange" | "cyan" | "none";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", hover = false, glow = "none", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border transition-all duration-300",
          variant === "default" && "glass",
          variant === "elevated" && "glass-strong",
          variant === "subtle" && "glass-subtle",
          variant === "strong" && "glass-strong border-white/[0.08]",
          hover && "hover:border-white/[0.1] hover:bg-white/[0.02] cursor-pointer",
          glow === "accent" && "hover:glow-accent",
          glow === "gold" && "hover:glow-gold",
          glow === "orange" && "hover:glow-orange",
          glow === "cyan" && "hover:glow-cyan",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard, type GlassCardProps };
