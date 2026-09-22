"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Badge } from "@/components/ui/badge";
import { StreakFire } from "@/components/ui/streak-fire";
import { Gift, CheckCircle } from "lucide-react";
import { safeDivide, formatNaira } from "@/lib/math";

interface Milestone {
  id: string;
  requiredStreak: number;
  rewardAmount: number;
  currency: string;
  active: boolean;
  eligible: boolean;
  claimed: boolean;
}

interface WalletData {
  balance: number;
  currency: string;
}

export default function RewardsPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/rewards/milestones").then((r) => r.json()),
      fetch("/api/wallet").then((r) => r.json()),
      fetch("/api/streak").then((r) => r.json()),
    ]).then(([milestonesData, walletData, streakData]) => {
      setMilestones(milestonesData.milestones || []);
      setWallet(walletData);
      setCurrentStreak(streakData.streak?.currentStreak || 0);
    });
  }, []);

  const handleClaim = async (milestoneId: string) => {
    setClaiming(milestoneId);
    try {
      const res = await fetch("/api/rewards/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId }),
      });
      if (res.ok) {
        const updated = await fetch("/api/rewards/milestones").then((r) => r.json());
        setMilestones(updated.milestones || []);
        const walletUpdated = await fetch("/api/wallet").then((r) => r.json());
        setWallet(walletUpdated);
      }
    } catch {}
    setClaiming(null);
  };

  const claimedCount = milestones.filter((m) => m.claimed).length;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[700px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-muted text-xs uppercase tracking-widest font-medium mb-1.5">Earnings</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Rewards</h1>
      </div>

      {/* Wallet Card */}
      <GlassCard variant="elevated" className="p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5 text-gold" />
            <span className="text-xs text-muted uppercase tracking-widest font-medium">Reward Wallet</span>
          </div>
          <div className="text-4xl font-bold text-gold tabular-nums mb-1 tracking-tight">
            ₦{formatNaira(wallet?.balance)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{claimedCount} milestones claimed</p>
        </div>
      </GlassCard>

      {/* Milestones */}
      <h2 className="text-xs text-muted uppercase tracking-widest font-medium mb-5">Milestone Roadmap</h2>
      {milestones.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground text-sm">No milestones available yet. Complete tasks to earn rewards!</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {milestones.map((m) => {
            const progress = safeDivide(currentStreak, m.requiredStreak) * 100;
            return (
              <GlassCard key={m.id} className={`p-6 ${m.claimed ? "border-accent/15" : ""}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <StreakFire size="sm" active={m.claimed} />
                    <div>
                      <div className="font-semibold text-sm">{m.requiredStreak}-Day Streak</div>
                      <div className="text-xs text-muted">Milestone</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gold tabular-nums">
                      ₦{formatNaira(m.rewardAmount)}
                    </div>
                    {m.claimed ? (
                      <Badge variant="accent">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Claimed
                      </Badge>
                    ) : m.eligible ? (
                      <GlassButton
                        size="sm"
                        variant="primary"
                        glow
                        onClick={() => handleClaim(m.id)}
                        disabled={claiming === m.id}
                      >
                        {claiming === m.id ? "Claiming..." : "Claim"}
                      </GlassButton>
                    ) : (
                      <Badge variant="muted">Locked</Badge>
                    )}
                  </div>
                </div>
                <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange to-gold transition-all duration-500"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted mt-2">
                  {m.claimed
                    ? "Completed"
                    : `${currentStreak}/${m.requiredStreak} days (${Math.round(progress)}%)`}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
