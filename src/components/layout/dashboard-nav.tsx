"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flame, MessageCircle, TrendingUp, User, Wallet, Bell, Shield, ArrowUpRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/streak", icon: Flame, label: "Streak" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/trade", icon: TrendingUp, label: "Trade" },
];

const secondaryItems = [
  { href: "/rewards", icon: Wallet, label: "Rewards" },
  { href: "/withdrawals", icon: ArrowUpRight, label: "Withdrawals" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/verify", icon: Shield, label: "Verification" },
  { href: "/support", icon: MessageCircle, label: "Support" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[220px] flex-col z-40">
        <div className="flex flex-col h-full glass-strong border-r border-white/[0.04]">
          {/* Logo */}
          <div className="px-5 py-6">
            <Link href="/home" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Flame className="h-4 w-4 text-accent" />
              </div>
              <span className="text-sm font-semibold tracking-tight">STREAKPAY</span>
            </Link>
          </div>

          {/* Primary Nav */}
          <nav className="flex-1 px-3 py-2">
            <div className="text-[10px] font-medium text-muted uppercase tracking-widest px-3 mb-2">
              Main
            </div>
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2 : 1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="text-[10px] font-medium text-muted uppercase tracking-widest px-3 mt-6 mb-2">
              Account
            </div>
            <div className="space-y-0.5">
              {secondaryItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200",
                      isActive
                        ? "bg-white/[0.04] text-foreground"
                        : "text-muted hover:text-foreground hover:bg-white/[0.02]"
                    )}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Profile Footer */}
          <div className="p-3 border-t border-white/[0.04]">
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                pathname.startsWith("/profile") || pathname.startsWith("/settings")
                  ? "bg-white/[0.04] text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
              )}
            >
              <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">Profile</div>
              </div>
              <Settings className="h-3.5 w-3.5 text-muted" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-pb">
        <div className="glass-strong border-t border-white/[0.04]">
          <div className="flex items-center justify-around h-16 px-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]",
                    isActive
                      ? "text-accent"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "p-1 rounded-lg transition-all duration-200",
                    isActive && "bg-accent/10"
                  )}>
                    <item.icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
            <Link
              href="/profile"
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]",
                pathname.startsWith("/profile") || pathname.startsWith("/settings")
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-all duration-200",
                (pathname.startsWith("/profile") || pathname.startsWith("/settings")) && "bg-accent/10"
              )}>
                <User className="h-5 w-5" strokeWidth={pathname.startsWith("/profile") || pathname.startsWith("/settings") ? 2 : 1.5} />
              </div>
              <span className="text-[10px] font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
