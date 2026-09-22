"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { StreakFire } from "@/components/ui/streak-fire";
import { StreakPayLoader } from "@/components/ui/streakpay-loader";
import { safeNumber, safeDivide, formatNaira } from "@/lib/math";

interface ActivityContent {
  type: string;
  [key: string]: unknown;
}

interface TodayActivity {
  id: string;
  activityType: string;
  title: string;
  description: string;
  content: ActivityContent;
  rewardCoins: number;
  started: boolean;
  completed: boolean;
  isCorrect: boolean | null;
  assignedDate: string;
}

interface Milestone {
  id: string;
  requiredStreak: number;
  rewardAmount: number;
  eligible: boolean;
  claimed: boolean;
}

interface StreakData {
  streak: { currentStreak: number; longestStreak: number };
  activity: TodayActivity | null;
  milestones: Milestone[];
}

type ActivityPhase = "loading" | "intro" | "playing" | "submitting" | "result";

export default function StreakPage() {
  const [data, setData] = useState<StreakData | null>(null);
  const [phase, setPhase] = useState<ActivityPhase>("loading");
  const [userResponse, setUserResponse] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [result, setResult] = useState<{ isCorrect: boolean; coinsAwarded: number; message: string } | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [streakRes, activityRes, milestonesRes] = await Promise.all([
        fetch("/api/streak").then((r) => r.json()),
        fetch("/api/activities/today").then((r) => r.json()),
        fetch("/api/rewards/milestones").then((r) => r.json()),
      ]);
      if (cancelled) return;

      const activity = activityRes.activity as TodayActivity | null;
      setData({
        streak: streakRes.streak || { currentStreak: 0, longestStreak: 0 },
        activity,
        milestones: milestonesRes.milestones || [],
      });

      if (activity?.completed) {
        setPhase("result");
        setResult({
          isCorrect: activity.isCorrect ?? false,
          coinsAwarded: 0,
          message: activity.isCorrect ? "Already completed today!" : "Already attempted today.",
        });
      } else if (activity?.started) {
        setPhase("playing");
      } else {
        setPhase("intro");
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const refetch = async () => {
    const [streakRes, activityRes, milestonesRes] = await Promise.all([
      fetch("/api/streak").then((r) => r.json()),
      fetch("/api/activities/today").then((r) => r.json()),
      fetch("/api/rewards/milestones").then((r) => r.json()),
    ]);
    const activity = activityRes.activity as TodayActivity | null;
    setData({
      streak: streakRes.streak || { currentStreak: 0, longestStreak: 0 },
      activity,
      milestones: milestonesRes.milestones || [],
    });
  };

  const handleStart = async () => {
    if (!data?.activity) return;
    try {
      await fetch("/api/activities/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: data.activity.id }),
      });
      setData((prev) =>
        prev ? { ...prev, activity: prev.activity ? { ...prev.activity, started: true } : null } : null
      );
      setPhase("playing");
    } catch {}
  };

  const handleSubmit = async () => {
    if (!data?.activity) return;
    const content = data.activity.content;
    const hasOptions =
      Array.isArray(content.options) && content.options.length > 0;
    const answer = hasOptions ? selectedOption : userResponse;
    if (!answer.trim()) return;

    setPhase("submitting");
    try {
      const res = await fetch("/api/activities/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: data.activity.id, response: answer }),
      });
      const resultData = await res.json();
      setResult(resultData);
      if (resultData.isCorrect) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 3000);
      }
      await refetch();
      setPhase("result");
    } catch {
      setPhase("playing");
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <StreakPayLoader />
      </div>
    );
  }

  const { streak, activity, milestones } = data;
  const currentStreak = safeNumber(streak.currentStreak);

  const nextMilestone = milestones
    .filter((m) => !m.claimed && currentStreak < m.requiredStreak)
    .sort((a, b) => a.requiredStreak - b.requiredStreak)[0];

  const renderActivityContent = () => {
    if (!activity) return null;
    const content = activity.content;

    switch (content.type) {
      case "short_story":
      case "story":
        return (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5 text-sm leading-relaxed whitespace-pre-line">
              {content.story as string}
            </div>
            <div className="glass rounded-2xl p-5">
              <p className="text-sm font-medium mb-3">{content.completion_prompt as string}</p>
              <GlassInput
                id="story-answer"
                label="Your Answer"
                placeholder="Type your answer..."
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
              />
            </div>
          </div>
        );

      case "quiz":
      case "trivia":
      case "science_question":
      case "engineering_question":
      case "science":
      case "engineering":
      case "pattern_recognition":
      case "pattern":
      case "memory_challenge":
      case "memory": {
        const options = (content.options as string[]) || [];
        const questionText = (content.question as string) || (content.problem as string) || "";
        return (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <p className="font-medium mb-4">{questionText}</p>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left p-3.5 rounded-xl text-sm transition-all duration-200 ${
                      selectedOption === opt
                        ? "bg-accent/15 text-accent border border-accent/25"
                        : "bg-white/[0.03] hover:bg-white/[0.06] border border-transparent"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case "riddle":
        return (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <p className="font-medium mb-2">{content.riddle as string}</p>
              <p className="text-xs text-muted">Hint: {content.hint as string}</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <GlassInput
                id="riddle-answer"
                label="Your Answer"
                placeholder="Type your answer..."
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
              />
            </div>
          </div>
        );

      case "math":
      case "logic_puzzle":
      case "logic":
      case "word_puzzle": {
        const problem = (content.problem as string) || (content.riddle as string) || (content.question as string) || (content.scrambled as string) || "";
        return (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <p className="font-medium mb-2">{problem}</p>
              {"hint" in content && <p className="text-xs text-muted">Hint: {content.hint as string}</p>}
            </div>
            <div className="glass rounded-2xl p-5">
              <GlassInput
                id="puzzle-answer"
                label="Your Answer"
                placeholder="Type your answer..."
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
              />
            </div>
          </div>
        );
      }

      case "reflection":
        return (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <p className="font-medium mb-2">{content.prompt as string}</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <GlassInput
                id="reflection-answer"
                label="Your Reflection"
                placeholder="Share your thoughts..."
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
              />
            </div>
          </div>
        );

      case "daily_poll":
      case "poll": {
        const options = (content.options as string[]) || [];
        return (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <p className="font-medium mb-4">{content.question as string}</p>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left p-3.5 rounded-xl text-sm transition-all duration-200 ${
                      selectedOption === opt
                        ? "bg-accent/15 text-accent border border-accent/25"
                        : "bg-white/[0.03] hover:bg-white/[0.06] border border-transparent"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="glass rounded-2xl p-5">
            <p className="text-sm text-muted-foreground">Activity type not supported yet.</p>
          </div>
        );
    }
  };

  const getActivityEmoji = (type: string) => {
    const map: Record<string, string> = {
      short_story: "\u{1F4D6}",
      quiz: "\u{2753}",
      riddle: "\u{1F9E9}",
      math_challenge: "\u{1F522}",
      logic_puzzle: "\u{1F9E0}",
      word_puzzle: "\u{1F4DD}",
      trivia: "\u{1F3C6}",
      reflection: "\u{1F4AD}",
      daily_poll: "\u{1F4CA}",
      pattern_recognition: "\u{1F50D}",
      memory_challenge: "\u{1F9E9}",
      science_question: "\u{1F52C}",
      engineering_question: "\u{2699}\u{FE0F}",
    };
    return map[type] || "\u{2B50}";
  };

  const canSubmit =
    (activity?.content && Array.isArray(activity.content.options) && activity.content.options.length > 0
      ? selectedOption.trim()
      : userResponse.trim()).length > 0;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[700px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-muted text-xs uppercase tracking-widest font-medium mb-1.5">Daily Activity</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your Streak</h1>
      </div>

      {/* Streak Hero */}
      <GlassCard variant="elevated" className={`p-10 text-center mb-8 relative overflow-hidden ${celebrating ? "glow-accent" : ""}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.03] to-transparent" />
        <div className="relative">
          <StreakFire size="xl" active={!activity?.completed} />
          <div className={`text-7xl font-bold mt-4 tabular-nums tracking-tighter transition-all ${celebrating ? "text-accent scale-105" : ""}`}>
            {currentStreak}
          </div>
          <div className="text-sm text-muted uppercase tracking-widest mt-2">Day Streak</div>
          <div className="text-sm text-muted-foreground mt-3">
            {nextMilestone
              ? `${nextMilestone.requiredStreak - currentStreak} days to next milestone`
              : currentStreak > 0
                ? "All milestones reached!"
                : "Complete your first activity to start!"}
          </div>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <GlassCard className="p-5 text-center">
          <div className="text-3xl font-bold tabular-nums">{currentStreak}</div>
          <div className="text-xs text-muted uppercase tracking-widest mt-1">Current</div>
        </GlassCard>
        <GlassCard className="p-5 text-center">
          <div className="text-3xl font-bold tabular-nums">{safeNumber(streak.longestStreak)}</div>
          <div className="text-xs text-muted uppercase tracking-widest mt-1">Longest</div>
        </GlassCard>
      </div>

      {/* Today's Activity */}
      <GlassCard variant="elevated" className="p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">{getActivityEmoji(activity?.activityType || "")}</span>
          <h2 className="text-base font-semibold">Today&apos;s Activity</h2>
        </div>

        {!activity ? (
          <p className="text-sm text-muted-foreground">Loading today&apos;s activity...</p>
        ) : phase === "intro" ? (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="font-medium mb-1">{activity.title}</div>
              <div className="text-sm text-muted-foreground">{activity.description}</div>
              <div className="text-xs text-accent mt-2 font-medium">+{activity.rewardCoins} coins reward</div>
            </div>
            <GlassButton variant="primary" onClick={handleStart} glow className="w-full">
              Start Activity
            </GlassButton>
          </div>
        ) : phase === "playing" ? (
          <div className="space-y-4">
            {renderActivityContent()}
            <GlassButton
              variant="primary"
              onClick={handleSubmit}
              disabled={!canSubmit}
              glow
              className="w-full"
            >
              Submit Answer
            </GlassButton>
          </div>
        ) : phase === "submitting" ? (
          <div className="text-center py-10 text-muted text-sm">Checking your answer...</div>
        ) : phase === "result" && result ? (
          <div className="space-y-4">
            <div className={`glass rounded-2xl p-8 text-center ${result.isCorrect ? "border-accent/15" : "border-error/15"}`}>
              <div className="text-5xl mb-3">{result.isCorrect ? "\u{1F389}" : "\u{1F605}"}</div>
              <div className={`text-lg font-semibold ${result.isCorrect ? "text-accent" : "text-error"}`}>
                {result.isCorrect ? "Correct!" : "Not quite right"}
              </div>
              {result.isCorrect && result.coinsAwarded > 0 && (
                <div className="text-gold font-medium mt-2">
                  +{result.coinsAwarded} coins earned
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-3">{result.message}</p>
              {!result.isCorrect && "explanation" in activity.content && (
                <p className="text-xs text-muted mt-2">
                  {String((activity.content as Record<string, unknown>).explanation)}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </GlassCard>

      {/* Milestone Roadmap */}
      <GlassCard className="p-6 mb-8">
        <h2 className="text-base font-semibold mb-5">Milestone Roadmap</h2>
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones available yet.</p>
        ) : (
          <div className="space-y-4">
            {milestones.map((m) => {
              const progress = safeDivide(currentStreak, m.requiredStreak) * 100;
              const status = m.claimed ? "claimed" : m.eligible ? "eligible" : "locked";
              return (
                <div key={m.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{m.requiredStreak}🔥</span>
                      <span className="text-xs text-muted font-medium">{m.requiredStreak}-day streak</span>
                    </div>
                    <div className="text-sm font-semibold tabular-nums">₦{formatNaira(m.rewardAmount)}</div>
                  </div>
                  <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-cyan transition-all duration-500"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted">{Math.round(progress)}%</span>
                    <span className={`text-[10px] font-medium ${
                      status === "claimed" ? "text-accent" :
                      status === "eligible" ? "text-gold" :
                      "text-muted"
                    }`}>
                      {status === "claimed" ? "Claimed" : status === "eligible" ? "Eligible" : "Locked"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Streak Calendar */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold mb-5">Streak Calendar</h2>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }, (_, i) => {
            const dayNum = i + 1;
            const isCompleted = dayNum <= currentStreak;
            const isToday = dayNum === currentStreak + 1;
            return (
              <div
                key={i}
                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-medium ${
                  isCompleted ? "bg-accent/15 text-accent" :
                  isToday ? "bg-gold/15 text-gold ring-1 ring-gold/25" :
                  "bg-white/[0.03] text-muted"
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
