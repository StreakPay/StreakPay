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
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Rewards</h1>

      <GlassCard variant="elevated" className="p-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="h-6 w-6 text-gold" />
          <h2 className="text-lg font-semibold">Reward Wallet</h2>
        </div>
        <div className="text-4xl font-bold text-gold tabular-nums mb-1">
          ₦{formatNaira(wallet?.balance)}
        </div>
        <p className="text-sm text-muted-foreground">{claimedCount} milestones claimed</p>
      </GlassCard>

      <h2 className="font-semibold mb-4">Milestone Roadmap</h2>
      {milestones.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <p className="text-muted-foreground text-sm">No milestones available yet. Complete tasks to earn rewards!</p>
        </GlassCard>
      ) : (
        <div className="space-y-4 mb-8">
          {milestones.map((m) => {
            const progress = safeDivide(currentStreak, m.requiredStreak) * 100;
            return (
              <GlassCard key={m.id} className={`p-6 ${m.claimed ? "border-accent/20" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <StreakFire size="sm" active={m.claimed} />
                    <div>
                      <div className="font-semibold">{m.requiredStreak}-Day Streak</div>
                      <div className="text-sm text-muted-foreground">Milestone</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gold tabular-nums">
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
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange to-gold"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
                <div className="text-xs text-muted mt-1">
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
