"use client";

import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";
import { Users, Shield, CreditCard, TrendingUp, Award, FileText } from "lucide-react";

const adminSections = [
  { title: "Overview", href: "/admin/stats", icon: TrendingUp, color: "text-accent" },
  { title: "Users", href: "/admin/users", icon: Users, color: "text-cyan" },
  { title: "Verification", href: "/admin/verify", icon: Shield, color: "text-gold" },
  { title: "Withdrawals", href: "/admin/withdrawals", icon: CreditCard, color: "text-orange" },
  { title: "Rewards", href: "/admin/rewards", icon: Award, color: "text-accent" },
  { title: "Audit Logs", href: "/admin/audit", icon: FileText, color: "text-muted" },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage StreakPay operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <GlassCard hover variant="elevated" className="p-6">
              <section.icon className={`h-8 w-8 ${section.color} mb-3`} />
              <h2 className="font-semibold">{section.title}</h2>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
