"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Award, TrendingUp } from "lucide-react";

const milestoneConfig = [
  { days: 20, reward: 5000, label: "20-Day Streak" },
  { days: 50, reward: 40000, label: "50-Day Streak" },
  { days: 100, reward: 110000, label: "100-Day Streak" },
];

export default function AdminRewardsPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Rewards Management</h1>

      <GlassCard variant="elevated" className="p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Award className="h-6 w-6 text-gold" />
          <h2 className="text-lg font-semibold">Milestone Configuration</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Milestone rewards are configured in the database. Users can claim rewards when they reach the required streak.
        </p>

        <div className="space-y-4">
          {milestoneConfig.map((m) => (
            <div key={m.days} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-sm text-muted-foreground">{m.days} consecutive days</div>
                </div>
                <div className="text-xl font-bold text-gold">₦{m.reward.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="elevated" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-accent" />
          <h2 className="text-lg font-semibold">Reward Rules</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-accent font-bold">•</span>
            <p>Rewards are automatically credited to the user&apos;s NGN wallet upon milestone claim.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-accent font-bold">•</span>
            <p>Each milestone can only be claimed once per user.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-accent font-bold">•</span>
            <p>Milestone eligibility is based on the user&apos;s current streak (not longest streak).</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-accent font-bold">•</span>
            <p>A ledger entry is created for every reward credit for audit purposes.</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
