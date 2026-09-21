"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-medium text-muted-foreground mb-1.5 tracking-wide uppercase"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full h-11 px-4 rounded-xl glass text-sm text-foreground placeholder:text-muted",
            "focus:outline-none focus:ring-1 focus:ring-accent/25 focus:border-accent/40",
            "transition-all duration-200",
            error && "border-error/40 focus:ring-error/25",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

export { GlassInput, type GlassInputProps };
