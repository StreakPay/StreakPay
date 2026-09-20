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
            className="block text-sm font-medium text-muted-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full h-10 px-3 rounded-xl glass text-sm text-foreground placeholder:text-muted",
            "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50",
            "transition-all duration-200",
            error && "border-error/50 focus:ring-error/30",
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
