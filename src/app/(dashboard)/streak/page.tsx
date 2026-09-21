"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { StreakFire } from "@/components/ui/streak-fire";
import { safeNumber, safeDivide, formatNaira } from "@/lib/math";

interface Milestone {
  id: string;
  requiredStreak: number;
  rewardAmount: number;
  eligible: boolean;
  claimed: boolean;
}

interface StreakData {
  streak: { currentStreak: number; longestStreak: number };
  todayTask: { title: string; description: string; activityType: string };
  completedToday: boolean;
  milestones: Milestone[];
}

export default function StreakPage() {
  const [data, setData] = useState<StreakData | null>(null);
  const [completing, setCompleting] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/streak").then((r) => r.json()),
      fetch("/api/rewards/milestones").then((r) => r.json()),
    ]).then(([streak, milestonesData]) => {
      setData({
        streak: streak.streak || { currentStreak: 0, longestStreak: 0 },
        todayTask: streak.todayTask || { title: "Daily Engagement", description: "Complete today's engagement activity", activityType: "daily_engagement" },
        completedToday: streak.completedToday || false,
        milestones: milestonesData.milestones || [],
      });
    });
  }, []);

  const completeTask = async () => {
    setCompleting(true);
    try {
      const res = await fetch("/api/streak/complete", { method: "POST" });
      if (res.ok) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 3000);
        const [streakRes, milestonesRes] = await Promise.all([
          fetch("/api/streak").then((r) => r.json()),
          fetch("/api/rewards/milestones").then((r) => r.json()),
        ]);
        setData({
          streak: streakRes.streak || { currentStreak: 0, longestStreak: 0 },
          todayTask: streakRes.todayTask || { title: "Daily Engagement", description: "Complete today's engagement activity", activityType: "daily_engagement" },
          completedToday: streakRes.completedToday || false,
          milestones: milestonesRes.milestones || [],
        });
      }
    } catch {}
    setCompleting(false);
  };

  if (!data) return <div className="p-8 text-muted">Loading...</div>;

  const { streak, todayTask, completedToday, milestones } = data;
  const currentStreak = safeNumber(streak.currentStreak);

  const nextMilestone = milestones
    .filter((m) => !m.claimed && currentStreak < m.requiredStreak)
    .sort((a, b) => a.requiredStreak - b.requiredStreak)[0];

  const daysToMilestone = nextMilestone ? nextMilestone.requiredStreak - currentStreak : 0;
  const progressToMilestone = nextMilestone
    ? safeDivide(currentStreak, nextMilestone.requiredStreak) * 100
    : currentStreak > 0 ? 100 : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Your Streak</h1>

      <GlassCard variant="elevated" className={`p-8 text-center mb-8 ${celebrating ? "glow-accent" : "glow-orange"}`}>
        <StreakFire size="xl" active={!completedToday} />
        <div className={`text-6xl font-bold mt-4 tabular-nums transition-all ${celebrating ? "text-accent scale-110" : ""}`}>
          {currentStreak}
        </div>
        <div className="text-lg text-muted-foreground">DAY STREAK</div>
        <div className="text-sm text-accent mt-2">
          {nextMilestone
            ? `${daysToMilestone} days to next milestone`
            : currentStreak > 0
              ? "All milestones reached!"
              : "Complete your first task to start!"}
        </div>
        <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden max-w-xs mx-auto">
          <div
            className="h-full bg-gradient-to-r from-orange to-gold rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, progressToMilestone)}%` }}
          />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <GlassCard className="p-6 text-center">
          <div className="text-3xl font-bold tabular-nums">{currentStreak}</div>
          <div className="text-sm text-muted-foreground">Current Streak</div>
        </GlassCard>
        <GlassCard className="p-6 text-center">
          <div className="text-3xl font-bold tabular-nums">{safeNumber(streak.longestStreak)}</div>
          <div className="text-sm text-muted-foreground">Longest Streak</div>
        </GlassCard>
      </div>

      <GlassCard variant="elevated" className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-2">Today&apos;s Mission</h2>
        <div className="glass rounded-xl p-4 mb-4">
          <div className="font-medium">{todayTask.title}</div>
          <div className="text-sm text-muted-foreground">{todayTask.description}</div>
        </div>
        {completedToday ? (
          <div className="flex items-center gap-2 text-accent">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Completed! Come back tomorrow.</span>
          </div>
        ) : (
          <GlassButton variant="primary" onClick={completeTask} disabled={completing} glow>
            {completing ? "Completing..." : "Complete Today&apos;s Task"}
          </GlassButton>
        )}
      </GlassCard>

      <GlassCard className="p-6 mb-8">
        <h2 className="font-semibold mb-4">Milestone Roadmap</h2>
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones available yet. Complete tasks to earn rewards!</p>
        ) : (
          <div className="space-y-3">
            {milestones.map((m) => {
              const progress = safeDivide(currentStreak, m.requiredStreak) * 100;
              const status = m.claimed ? "claimed" : m.eligible ? "eligible" : "locked";
              return (
                <div key={m.id} className="flex items-center gap-4">
                  <div className="text-sm font-mono w-20">{m.requiredStreak}🔥</div>
                  <div className="flex-1">
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-cyan"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-semibold w-24 text-right">₦{formatNaira(m.rewardAmount)}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full ${
                    status === "claimed" ? "bg-accent/10 text-accent" :
                    status === "eligible" ? "bg-gold/10 text-gold" :
                    "bg-white/5 text-muted"
                  }`}>
                    {status === "claimed" ? "Claimed" : status === "eligible" ? "Eligible" : "Locked"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="font-semibold mb-4">Streak Calendar</h2>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }, (_, i) => {
            const dayNum = i + 1;
            const isCompleted = dayNum <= currentStreak;
            const isToday = dayNum === currentStreak + 1;
            return (
              <div
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs ${
                  isCompleted ? "bg-accent/20 text-accent" :
                  isToday ? "bg-gold/20 text-gold ring-1 ring-gold/30" :
                  "bg-white/5 text-muted"
                }`}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
