"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { StreakFire } from "@/components/ui/streak-fire";
import { GlassButton } from "@/components/ui/glass-button";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

interface DashboardData {
  streak: { currentStreak: number; longestStreak: number };
  todayTask: { title: string; description: string; activityType: string };
  completedToday: boolean;
  wallet: { balance: number; currency: string };
  trading: { cashBalance: number; totalPnL: number; unrealizedPnL: number };
}

export default function HomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/streak").then((r) => r.json()),
      fetch("/api/wallet").then((r) => r.json()),
      fetch("/api/trading/account").then((r) => r.json()),
    ]).then(([streak, wallet, trading]) => {
      setData({
        streak: streak.streak || { currentStreak: 0, longestStreak: 0 },
        todayTask: streak.todayTask || { title: "Daily Engagement", description: "Complete today's engagement activity", activityType: "daily_engagement" },
        completedToday: streak.completedToday || false,
        wallet: { balance: wallet.balance || 0, currency: wallet.currency || "NGN" },
        trading: {
          cashBalance: trading.account?.cashBalance || 10000,
          totalPnL: trading.account?.totalPnL || 0,
          unrealizedPnL: trading.unrealizedPnL || 0,
        },
      });
    });
  }, []);

  if (!data) return <div className="p-8 text-muted">Loading...</div>;

  const nextMilestone = data.streak.currentStreak < 20 ? 20 : data.streak.currentStreak < 50 ? 50 : 100;
  const daysToMilestone = nextMilestone - data.streak.currentStreak;
  const portfolioValue = data.trading.cashBalance + data.trading.unrealizedPnL;

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
          <div className="text-4xl font-bold mt-2 tabular-nums">{data.streak.currentStreak}</div>
          <div className="text-sm text-muted-foreground">Day Streak</div>
          <div className="text-xs text-accent mt-1">
            {daysToMilestone > 0 ? `${daysToMilestone} days to next milestone` : "Milestone reached!"}
          </div>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="text-xs text-muted-foreground mb-1">Reward Wallet</div>
          <div className="text-2xl font-bold text-gold tabular-nums">₦{data.wallet.balance.toLocaleString()}</div>
          <div className="text-xs text-muted mt-2">Available for withdrawal</div>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="text-xs text-muted-foreground mb-1">Virtual Portfolio</div>
          <div className="text-2xl font-bold tabular-nums">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className={`text-xs mt-2 ${data.trading.unrealizedPnL >= 0 ? "text-accent" : "text-error"}`}>
            {data.trading.unrealizedPnL >= 0 ? "+" : ""}${data.trading.unrealizedPnL.toFixed(2)} today
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
              <span className="text-accent">{data.streak.longestStreak} days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Wallet Balance</span>
              <span className="text-gold">₦{data.wallet.balance.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Portfolio Value</span>
              <span>${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold mb-2">✦ STREAK AI Insight</h3>
          <p className="text-sm text-muted-foreground">
            {data.streak.currentStreak > 0
              ? `You're on a ${data.streak.currentStreak}-day streak! ${!data.completedToday ? "Complete today's task to keep it going." : "Great job completing today's task!"} You're ${daysToMilestone} days away from your next milestone reward.`
              : "Start your streak today! Complete daily activities to earn rewards and build your streak."}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
