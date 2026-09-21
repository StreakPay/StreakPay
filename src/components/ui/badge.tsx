import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "accent" | "gold" | "orange" | "cyan" | "error" | "success" | "warning" | "muted";
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", size = "sm", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" && "px-2 py-0.5 text-[10px] tracking-wide",
        size === "md" && "px-2.5 py-1 text-xs",
        variant === "default" && "glass text-foreground",
        variant === "accent" && "bg-accent/10 text-accent border border-accent/15",
        variant === "gold" && "bg-gold/10 text-gold border border-gold/15",
        variant === "orange" && "bg-orange/10 text-orange border border-orange/15",
        variant === "cyan" && "bg-cyan/10 text-cyan border border-cyan/15",
        variant === "error" && "bg-error/10 text-error border border-error/15",
        variant === "success" && "bg-success/10 text-success border border-success/15",
        variant === "warning" && "bg-warning/10 text-warning border border-warning/15",
        variant === "muted" && "bg-white/[0.04] text-muted-foreground border border-white/[0.04]",
        className
      )}
    >
      {children}
    </span>
  );
}
