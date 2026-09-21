"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { StreakFire } from "@/components/ui/streak-fire";
import { GlassButton } from "@/components/ui/glass-button";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { safeNumber, formatNaira, formatDollar } from "@/lib/math";

interface Milestone {
  id: string;
  requiredStreak: number;
  rewardAmount: number;
  eligible: boolean;
  claimed: boolean;
}

interface DashboardData {
  streak: { currentStreak: number; longestStreak: number };
  todayTask: { title: string; description: string; activityType: string };
  completedToday: boolean;
  wallet: { balance: number; currency: string };
  trading: { cashBalance: number; totalPnl: number; unrealizedPnl: number };
  nextMilestone: { requiredStreak: number; daysRemaining: number } | null;
  milestones: Milestone[];
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
    ]).then(([streak, wallet, trading, milestonesData]) => {
      const currentStreak = safeNumber(streak.streak?.currentStreak);
      const longestStreak = safeNumber(streak.streak?.longestStreak);
      const milestones: Milestone[] = milestonesData.milestones || [];

      const nextMilestone = milestones
        .filter((m) => !m.claimed && currentStreak < m.requiredStreak)
        .sort((a, b) => a.requiredStreak - b.requiredStreak)[0] || null;

      setData({
        streak: { currentStreak, longestStreak },
        todayTask: streak.todayTask || { title: "Daily Engagement", description: "Complete today's engagement activity", activityType: "daily_engagement" },
        completedToday: streak.completedToday || false,
        wallet: { balance: safeNumber(wallet.balance), currency: wallet.currency || "NGN" },
        trading: {
          cashBalance: safeNumber(trading.account?.cashBalance),
          totalPnl: safeNumber(trading.account?.totalPnl),
          unrealizedPnl: safeNumber(trading.account?.unrealizedPnl),
        },
        nextMilestone: nextMilestone
          ? { requiredStreak: nextMilestone.requiredStreak, daysRemaining: nextMilestone.requiredStreak - currentStreak }
          : null,
        milestones,
      });
    });
  }, []);

  if (!data) return <div className="p-8 text-muted">Loading...</div>;

  const { streak, wallet, trading, nextMilestone } = data;
  const portfolioValue = trading.cashBalance + trading.unrealizedPnl;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm">{getGreeting()}</p>
        <h1 className="text-2xl font-bold">Welcome back{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}!</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <GlassCard variant="elevated" className="p-6 text-center glow-accent">
          <StreakFire size="lg" />
          <div className="text-4xl font-bold mt-2 tabular-nums">{streak.currentStreak}</div>
          <div className="text-sm text-muted-foreground">Day Streak</div>
          <div className="text-xs text-accent mt-1">
            {nextMilestone
              ? `${nextMilestone.daysRemaining} days to next milestone`
              : streak.currentStreak > 0
                ? "All milestones claimed!"
                : "Start your streak today!"}
          </div>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="text-xs text-muted-foreground mb-1">Reward Wallet</div>
          <div className="text-2xl font-bold text-gold tabular-nums">₦{formatNaira(wallet.balance)}</div>
          <div className="text-xs text-muted mt-2">Available for withdrawal</div>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="text-xs text-muted-foreground mb-1">Virtual Portfolio</div>
          <div className="text-2xl font-bold tabular-nums">${formatDollar(portfolioValue)}</div>
          <div className={`text-xs mt-2 ${trading.unrealizedPnl >= 0 ? "text-accent" : "text-error"}`}>
            {trading.unrealizedPnl >= 0 ? "+" : ""}${safeNumber(trading.unrealizedPnl).toFixed(2)} today
          </div>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="text-xs text-muted-foreground mb-1">Today&apos;s Activity</div>
          <div className="text-2xl font-bold tabular-nums">{data.completedToday ? "1/1" : "0/1"}</div>
          <div className="text-xs text-muted mt-2">
            {data.completedToday ? "Completed!" : "tasks remaining"}
          </div>
        </GlassCard>
      </div>

      <GlassCard variant="elevated" className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-2">Today&apos;s Mission</h2>
        <p className="text-muted-foreground text-sm mb-4">
          {data.completedToday
            ? "You've completed today's task. Come back tomorrow!"
            : data.todayTask.description}
        </p>
        {!data.completedToday && (
          <Link href="/streak">
            <GlassButton variant="primary" glow>Start Today&apos;s Task</GlassButton>
          </Link>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-2">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Longest Streak</span>
              <span className="text-accent">{streak.longestStreak} days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Wallet Balance</span>
              <span className="text-gold">₦{formatNaira(wallet.balance)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Portfolio Value</span>
              <span>${formatDollar(portfolioValue)}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold mb-2">✦ STREAK AI Insight</h3>
          <p className="text-sm text-muted-foreground">
            {streak.currentStreak > 0
              ? `You're on a ${streak.currentStreak}-day streak! ${!data.completedToday ? "Complete today's task to keep it going." : "Great job completing today's task!"}${nextMilestone ? ` You're ${nextMilestone.daysRemaining} days away from your next milestone reward.` : ""}`
              : "Start your streak today! Complete daily activities to earn rewards and build your streak."}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
