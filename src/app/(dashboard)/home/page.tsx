"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { StreakFire } from "@/components/ui/streak-fire";
import { GlassButton } from "@/components/ui/glass-button";
import { StreakPayLoader } from "@/components/ui/streakpay-loader";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { safeNumber, formatNaira, formatDollar } from "@/lib/math";
import { ArrowUpRight, TrendingUp, Wallet, Flame } from "lucide-react";

interface Milestone {
  id: string;
  requiredStreak: number;
  rewardAmount: number;
  eligible: boolean;
  claimed: boolean;
}

interface TodayActivity {
  title: string;
  description: string;
  completed: boolean;
  rewardCoins: number;
}

interface DashboardData {
  streak: { currentStreak: number; longestStreak: number };
  wallet: { balance: number; currency: string };
  trading: { cashBalance: number; totalPnl: number; unrealizedPnl: number };
  nextMilestone: { requiredStreak: number; daysRemaining: number } | null;
  activity: TodayActivity | null;
}

export default function HomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/streak").then((r) => r.json()),
      fetch("/api/wallet").then((r) => r.json()),
      fetch("/api/trading/account").then((r) => r.json()),
      fetch("/api/rewards/milestones").then((r) => r.json()),
      fetch("/api/activities/today").then((r) => r.json()),
    ]).then(([streak, wallet, trading, milestonesData, activityData]) => {
      const currentStreak = safeNumber(streak.streak?.currentStreak);
      const longestStreak = safeNumber(streak.streak?.longestStreak);
      const milestones: Milestone[] = milestonesData.milestones || [];

      const nextMilestone = milestones
        .filter((m) => !m.claimed && currentStreak < m.requiredStreak)
        .sort((a, b) => a.requiredStreak - b.requiredStreak)[0] || null;

      setData({
        streak: { currentStreak, longestStreak },
        wallet: { balance: safeNumber(wallet.balance), currency: wallet.currency || "NGN" },
        trading: {
          cashBalance: safeNumber(trading.account?.cashBalance),
          totalPnl: safeNumber(trading.account?.totalPnl),
          unrealizedPnl: safeNumber(trading.account?.unrealizedPnl),
        },
        nextMilestone: nextMilestone
          ? { requiredStreak: nextMilestone.requiredStreak, daysRemaining: nextMilestone.requiredStreak - currentStreak }
          : null,
        activity: activityData.activity
          ? {
              title: activityData.activity.title,
              description: activityData.activity.description,
              completed: activityData.activity.completed,
              rewardCoins: activityData.activity.rewardCoins,
            }
          : null,
      });
    });
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <StreakPayLoader />
      </div>
    );
  }

  const { streak, wallet, trading, nextMilestone, activity } = data;
  const portfolioValue = trading.cashBalance + trading.unrealizedPnl;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      {/* Welcome Header */}
      <div className="mb-10">
        <p className="text-muted text-xs uppercase tracking-widest font-medium mb-1.5">{getGreeting()}</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Welcome back{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
        </h1>
      </div>

      {/* Hero: Streak + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
        {/* Streak Hero Card */}
        <GlassCard variant="elevated" className="md:col-span-3 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <StreakFire size="lg" />
              <div>
                <div className="text-xs text-muted uppercase tracking-widest font-medium">Current Streak</div>
              </div>
            </div>
            <div className="flex items-end gap-4 mb-4">
              <span className="text-6xl md:text-7xl font-bold tabular-nums tracking-tighter">
                {streak.currentStreak}
              </span>
              <span className="text-lg text-muted mb-2">days</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {nextMilestone
                ? `${nextMilestone.daysRemaining} days to your next milestone`
                : streak.currentStreak > 0
                  ? "All milestones claimed!"
                  : "Start your streak today"}
            </div>
          </div>
        </GlassCard>

        {/* Today's Activity */}
        <GlassCard variant="elevated" className="md:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs text-muted uppercase tracking-widest font-medium mb-4">Today&apos;s Mission</div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              {activity?.completed
                ? "Completed! Come back tomorrow for the next one."
                : activity?.description || "Loading today's activity..."}
            </div>
          </div>
          {!activity?.completed && activity && (
            <Link href="/streak" className="mt-6">
              <GlassButton variant="primary" className="w-full" glow>
                Start Activity
              </GlassButton>
            </Link>
          )}
        </GlassCard>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gold/8 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-gold" />
            </div>
          </div>
          <div className="text-xs text-muted uppercase tracking-widest font-medium mb-1">Wallet</div>
          <div className="text-xl font-bold text-gold tabular-nums">₦{formatNaira(wallet.balance)}</div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-cyan/8 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-cyan" />
            </div>
          </div>
          <div className="text-xs text-muted uppercase tracking-widest font-medium mb-1">Portfolio</div>
          <div className="text-xl font-bold tabular-nums">${formatDollar(portfolioValue)}</div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-accent/8 flex items-center justify-center">
              <Flame className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="text-xs text-muted uppercase tracking-widest font-medium mb-1">Longest</div>
          <div className="text-xl font-bold tabular-nums">{streak.longestStreak}d</div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-orange/8 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-orange" />
            </div>
          </div>
          <div className="text-xs text-muted uppercase tracking-widest font-medium mb-1">Today</div>
          <div className="text-xl font-bold tabular-nums">{activity?.completed ? "1/1" : "0/1"}</div>
        </GlassCard>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/trade">
          <GlassCard hover className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold mb-0.5">Trading Terminal</div>
              <div className="text-xs text-muted">Virtual SPK market</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-accent">
              Open <ArrowUpRight className="h-3 w-3" />
            </div>
          </GlassCard>
        </Link>

        <Link href="/rewards">
          <GlassCard hover className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold mb-0.5">Rewards</div>
              <div className="text-xs text-muted">Claim milestone rewards</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gold">
              Open <ArrowUpRight className="h-3 w-3" />
            </div>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
