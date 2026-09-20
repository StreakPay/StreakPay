"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "primary", size = "md", glow = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variant === "primary" && "bg-accent text-black hover:bg-accent/90 active:scale-[0.98]",
          variant === "secondary" && "glass hover:bg-white/[0.05] active:scale-[0.98]",
          variant === "ghost" && "bg-transparent hover:bg-white/[0.05] active:scale-[0.98]",
          variant === "danger" && "bg-error/10 text-error border border-error/20 hover:bg-error/20 active:scale-[0.98]",
          size === "sm" && "h-8 px-3 text-sm",
          size === "md" && "h-10 px-5 text-sm",
          size === "lg" && "h-12 px-6 text-base",
          glow && variant === "primary" && "glow-accent",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export { GlassButton, type GlassButtonProps };
