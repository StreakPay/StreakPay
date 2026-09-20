"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flame, Music, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/streak", icon: Flame, label: "Streak" },
  { href: "/music", icon: Music, label: "Music" },
  { href: "/trade", icon: TrendingUp, label: "Trade" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/[0.06] md:hidden">
      <div className="flex items-center justify-around h-16 px-2 safe-area-pb">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors",
                isActive ? "text-accent" : "text-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
