"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#trading", label: "Trading" },
  { href: "#ai", label: "STREAK AI" },
];

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-black font-bold text-sm">
              SP
            </div>
            <span className="text-lg font-bold tracking-tight">STREAKPAY</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <GlassButton variant="ghost" size="sm">Log In</GlassButton>
            </Link>
            <Link href="/register">
              <GlassButton variant="primary" size="sm" glow>Get Started</GlassButton>
            </Link>
          </div>

          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/[0.06] mt-2 pt-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-2 mt-2">
                <Link href="/login" className="flex-1">
                  <GlassButton variant="secondary" size="sm" className="w-full">Log In</GlassButton>
                </Link>
                <Link href="/register" className="flex-1">
                  <GlassButton variant="primary" size="sm" glow className="w-full">Get Started</GlassButton>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
