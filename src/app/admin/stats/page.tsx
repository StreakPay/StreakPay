"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Users, Shield, CreditCard, TrendingUp, AlertTriangle } from "lucide-react";

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  pendingVerification: number;
  totalRewardLiability: number;
  pendingWithdrawals: number;
  withdrawalLiability: number;
  totalPaymentVolume: number;
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => setStats(data.stats));
  }, []);

  if (!stats) return <div className="p-8 text-muted">Loading...</div>;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-cyan" },
    { label: "Verified Users", value: stats.verifiedUsers, icon: Shield, color: "text-accent" },
    { label: "Pending Verification", value: stats.pendingVerification, icon: AlertTriangle, color: "text-gold" },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: CreditCard, color: "text-orange" },
    { label: "Total Reward Liability", value: `₦${stats.totalRewardLiability.toLocaleString()}`, icon: TrendingUp, color: "text-gold" },
    { label: "Withdrawal Liability", value: `₦${stats.withdrawalLiability.toLocaleString()}`, icon: CreditCard, color: "text-orange" },
    { label: "Total Payment Volume", value: `₦${stats.totalPaymentVolume.toLocaleString()}`, icon: TrendingUp, color: "text-accent" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Financial Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <GlassCard key={i} variant="elevated" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold tabular-nums">{card.value}</div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
