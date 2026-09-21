"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { StreakFire } from "@/components/ui/streak-fire";
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
    const answer = data.activity.content.type === "daily_poll" ? selectedOption : userResponse;
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

  if (!data) return <div className="p-8 text-muted">Loading...</div>;

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
        return (
          <div className="space-y-4">
            <div className="glass rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line">
              {content.story as string}
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-sm font-medium mb-2">{content.completion_prompt as string}</p>
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
      case "engineering_question": {
        const options = (content.options as string[]) || [];
        return (
          <div className="space-y-4">
            <div className="glass rounded-xl p-4">
              <p className="font-medium mb-4">{content.question as string}</p>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                      selectedOption === opt
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-white/5 hover:bg-white/10 border border-transparent"
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
            <div className="glass rounded-xl p-4">
              <p className="font-medium mb-2">{content.riddle as string}</p>
              <p className="text-xs text-muted">Hint: {content.hint as string}</p>
            </div>
            <div className="glass rounded-xl p-4">
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
      case "word_puzzle":
      case "memory_challenge":
      case "pattern_recognition": {
        const problem = (content.problem as string) || (content.riddle as string) || (content.question as string) || "";
        return (
          <div className="space-y-4">
            <div className="glass rounded-xl p-4">
              <p className="font-medium mb-2">{problem}</p>
              {"hint" in content && <p className="text-xs text-muted">Hint: {content.hint as string}</p>}
            </div>
            <div className="glass rounded-xl p-4">
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
            <div className="glass rounded-xl p-4">
              <p className="font-medium mb-2">{content.prompt as string}</p>
            </div>
            <div className="glass rounded-xl p-4">
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

      case "daily_poll": {
        const options = (content.options as string[]) || [];
        return (
          <div className="space-y-4">
            <div className="glass rounded-xl p-4">
              <p className="font-medium mb-4">{content.question as string}</p>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                      selectedOption === opt
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-white/5 hover:bg-white/10 border border-transparent"
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
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Activity type not supported yet.</p>
          </div>
        );
    }
  };

  const getActivityEmoji = (type: string) => {
    const map: Record<string, string> = {
      short_story: "📖",
      quiz: "❓",
      riddle: "🧩",
      math_challenge: "🔢",
      logic_puzzle: "🧠",
      word_puzzle: "📝",
      trivia: "🏆",
      reflection: "💭",
      daily_poll: "📊",
      pattern_recognition: "🔍",
      memory_challenge: "🧩",
      science_question: "🔬",
      engineering_question: "⚙️",
    };
    return map[type] || "⭐";
  };

  const canSubmit =
    (activity?.content.type === "daily_poll" ? selectedOption.trim() : userResponse.trim()).length > 0;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Your Streak</h1>

      {/* Streak Stats */}
      <GlassCard variant="elevated" className={`p-8 text-center mb-8 ${celebrating ? "glow-accent" : "glow-orange"}`}>
        <StreakFire size="xl" active={!activity?.completed} />
        <div className={`text-6xl font-bold mt-4 tabular-nums transition-all ${celebrating ? "text-accent scale-110" : ""}`}>
          {currentStreak}
        </div>
        <div className="text-lg text-muted-foreground">DAY STREAK</div>
        <div className="text-sm text-accent mt-2">
          {nextMilestone
            ? `${nextMilestone.requiredStreak - currentStreak} days to next milestone`
            : currentStreak > 0
              ? "All milestones reached!"
              : "Complete your first activity to start!"}
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

      {/* Today's Activity */}
      <GlassCard variant="elevated" className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">
          {getActivityEmoji(activity?.activityType || "")} Today&apos;s Activity
        </h2>

        {!activity ? (
          <p className="text-sm text-muted-foreground">Loading today&apos;s activity...</p>
        ) : phase === "intro" ? (
          <div className="space-y-4">
            <div className="glass rounded-xl p-4">
              <div className="font-medium mb-1">{activity.title}</div>
              <div className="text-sm text-muted-foreground">{activity.description}</div>
              <div className="text-xs text-accent mt-2">+{activity.rewardCoins} coins reward</div>
            </div>
            <GlassButton variant="primary" onClick={handleStart} glow>
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
            >
              Submit Answer
            </GlassButton>
          </div>
        ) : phase === "submitting" ? (
          <div className="text-center py-8 text-muted">Checking your answer...</div>
        ) : phase === "result" && result ? (
          <div className="space-y-4">
            <div className={`glass rounded-xl p-6 text-center ${result.isCorrect ? "border-accent/20" : "border-error/20"}`}>
              <div className="text-4xl mb-2">{result.isCorrect ? "🎉" : "😅"}</div>
              <div className={`text-lg font-semibold ${result.isCorrect ? "text-accent" : "text-error"}`}>
                {result.isCorrect ? "Correct!" : "Not quite right"}
              </div>
              {result.isCorrect && result.coinsAwarded > 0 && (
                <div className="text-gold font-medium mt-2">
                  +{result.coinsAwarded} coins earned
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">{result.message}</p>
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
        <h2 className="font-semibold mb-4">Milestone Roadmap</h2>
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones available yet.</p>
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

      {/* Streak Calendar */}
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
