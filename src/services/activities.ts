import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { safeNumber } from "@/lib/math";
import { creditCoins } from "./coins";
import { getMultiplier, calculateReward } from "./multiplier";
import { checkDailyCap, checkRateLimit, getDiminishingReturnsFactor, recordRewardEvent } from "./anti-abuse";

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

interface CompletionResult {
  success: boolean;
  isCorrect: boolean;
  coinsAwarded: number;
  coinsAwardedSPK: number;
  currentStreak: number;
  longestStreak: number;
  message: string;
}

function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Deterministically pick today's activity for a user.
 * Uses the date as a seed so every user gets the same activity on the same day.
 */
function pickActivityForDate(date: string, activityCount: number): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    const char = date.charCodeAt(i);
    hash = (hash * 31 + char) % activityCount;
  }
  return hash;
}

/**
 * Get or create today's activity assignment for a user.
 */
export async function getTodayActivity(userId: string): Promise<TodayActivity | null> {
  const supabase = await createClient();
  const today = getTodayDate();

  // Check existing assignment
  const { data: existing } = await supabase
    .from("user_activity_assignments")
    .select(`
      id,
      activity_id,
      started_at,
      completed_at,
      user_response,
      is_correct,
      assigned_date,
      daily_activities!inner (
        id,
        activity_type,
        title,
        description,
        content,
        reward_coins
      )
    `)
    .eq("user_id", userId)
    .eq("assigned_date", today)
    .single();

  if (existing) {
    const act = existing.daily_activities as unknown as {
      id: string;
      activity_type: string;
      title: string;
      description: string;
      content: ActivityContent;
      reward_coins: number;
    };
    return {
      id: existing.id,
      activityType: act.activity_type,
      title: act.title,
      description: act.description,
      content: act.content,
      rewardCoins: act.reward_coins,
      started: !!existing.started_at,
      completed: !!existing.completed_at,
      isCorrect: existing.is_correct,
      assignedDate: existing.assigned_date,
    };
  }

  // Pick today's activity from the pool
  const { data: activities } = await supabase
    .from("daily_activities")
    .select("id, activity_type, title, description, content, reward_coins")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (!activities || activities.length === 0) return null;

  const idx = pickActivityForDate(today, activities.length);
  const chosen = activities[idx];

  // Create assignment
  const { data: assignment } = await supabase
    .from("user_activity_assignments")
    .insert({
      user_id: userId,
      activity_id: chosen.id,
      assigned_date: today,
    })
    .select("id, assigned_date")
    .single();

  return {
    id: assignment?.id || "",
    activityType: chosen.activity_type,
    title: chosen.title,
    description: chosen.description,
    content: chosen.content as ActivityContent,
    rewardCoins: chosen.reward_coins,
    started: false,
    completed: false,
    isCorrect: null,
    assignedDate: today,
  };
}

/**
 * Mark activity as started (user opened it).
 */
export async function startActivity(userId: string, assignmentId: string): Promise<void> {
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("user_activity_assignments")
    .select("id, started_at")
    .eq("id", assignmentId)
    .eq("user_id", userId)
    .single();

  if (!assignment) throw new Error("Activity assignment not found");
  if (assignment.started_at) return; // already started

  await supabase
    .from("user_activity_assignments")
    .update({ started_at: new Date().toISOString() })
    .eq("id", assignmentId);
}

/**
 * Validate and score a user's response to an activity.
 */
function scoreResponse(content: ActivityContent, response: string): boolean {
  const responseType = content.type;
  const normalizedResponse = response.trim().toLowerCase();

  switch (responseType) {
    case "story":
    case "riddle":
    case "reflection": {
      const accepted = (content.accepted_answers as string[]) || [];
      const scoring = (content.scoring as string) || "contains_any";
      if (scoring === "contains_any") {
        return accepted.some((a) => normalizedResponse.includes(a.toLowerCase()));
      }
      return accepted.includes(normalizedResponse);
    }

    case "quiz":
    case "trivia":
    case "science_question":
    case "engineering_question": {
      return normalizedResponse === ((content.correct_answer as string) || "").toLowerCase();
    }

    case "math": {
      const accepted = (content.accepted_answers as string[]) || [];
      return accepted.some((a) => normalizedResponse === a.toLowerCase());
    }

    case "logic_puzzle":
    case "word_puzzle":
    case "memory_challenge":
    case "pattern_recognition": {
      const accepted = (content.accepted_answers as string[]) || [];
      return accepted.some((a) => normalizedResponse === a.toLowerCase());
    }

    case "daily_poll": {
      // Polls are always "correct" — any choice counts as completion
      return true;
    }

    default:
      return false;
  }
}

/**
 * Submit a response and complete the activity if correct.
 * Server-side validation. Awards streak + coins on success.
 */
export async function submitActivityResponse(
  userId: string,
  assignmentId: string,
  response: string
): Promise<CompletionResult> {
  const supabase = await createClient();

  // Fetch the assignment with activity content
  const { data: assignment } = await supabase
    .from("user_activity_assignments")
    .select(`
      id,
      completed_at,
      activity_id,
      daily_activities!inner (
        content,
        reward_coins,
        activity_type
      )
    `)
    .eq("id", assignmentId)
    .eq("user_id", userId)
    .single();

  if (!assignment) throw new Error("Activity assignment not found");
  if (assignment.completed_at) {
    throw new Error("Activity already completed today");
  }

  const act = assignment.daily_activities as unknown as {
    content: ActivityContent;
    reward_coins: number;
    activity_type: string;
  };

  const isCorrect = scoreResponse(act.content, response);

  // Mark the assignment completed
  await supabase
    .from("user_activity_assignments")
    .update({
      completed_at: new Date().toISOString(),
      user_response: { answer: response },
      is_correct: isCorrect,
    })
    .eq("id", assignmentId);

  if (!isCorrect) {
    return {
      success: true,
      isCorrect: false,
      coinsAwarded: 0,
      coinsAwardedSPK: 0,
      currentStreak: 0,
      longestStreak: 0,
      message: "Incorrect answer. Try again tomorrow to keep your streak!",
    };
  }

  // ---- Correct answer: update streak + award coins ----

  // Get or create streak
  let { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!streak) {
    const { data: newStreak } = await supabase
      .from("streaks")
      .insert({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
      })
      .select("*")
      .single();
    streak = newStreak;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastCompletion = streak.last_completion_date
    ? new Date(streak.last_completion_date)
    : null;

  let newStreakCount: number;

  if (!lastCompletion) {
    // First ever completion
    newStreakCount = 1;
  } else {
    const lastDate = new Date(lastCompletion);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - lastDate.getTime()) / 86400000
    );

    if (diffDays === 0) {
      // Already completed today — should not reach here due to duplicate check
      newStreakCount = streak.current_streak;
    } else if (diffDays === 1) {
      // Consecutive day
      newStreakCount = streak.current_streak + 1;
    } else {
      // Streak broken
      newStreakCount = 1;
    }
  }

  const newLongest = Math.max(safeNumber(streak.longest_streak), newStreakCount);

  // Calculate reward: base 10 coins + streak bonus
  const streakBonus = Math.min(newStreakCount * 2, 20); // max 20 bonus
  const coinsAwarded = act.reward_coins + streakBonus;

  // Update streak
  await supabase
    .from("streaks")
    .update({
      current_streak: newStreakCount,
      longest_streak: newLongest,
      last_completion_date: today.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  // Get streak ID
  const { data: streakRow } = await supabase
    .from("streaks")
    .select("id")
    .eq("user_id", userId)
    .single();

  // Record activity completion
  await supabase.from("activity_completions").insert({
    user_id: userId,
    assignment_id: assignmentId,
    streak_id: streakRow?.id,
    activity_type: act.activity_type,
    coins_awarded: coinsAwarded,
    streak_day: newStreakCount,
  });

  // Credit wallet (NGN cash)
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("currency", "NGN")
    .single();

  if (wallet) {
    const newBalance = safeNumber(wallet.balance) + coinsAwarded;
    await supabase
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);

    await supabase.from("ledger_entries").insert({
      user_id: userId,
      amount: coinsAwarded,
      currency: "NGN",
      direction: "credit",
      type: "activity_reward",
      reference: `ACT-${Date.now()}-${uuidv4().slice(0, 6)}`,
      source: "daily_activity",
      status: "completed",
      metadata: {
        assignmentId,
        activityType: act.activity_type,
        streakDay: newStreakCount,
        isCorrect: true,
      },
    });
  }

  // ---- Award StreakPay Coins ----
  let coinsAwardedSPK = 0;
  const rateCheck = await checkRateLimit(userId);
  const dailyCap = await checkDailyCap(userId);

  if (rateCheck.allowed && dailyCap.allowed) {
    const [multiplier, dimFactor] = await Promise.all([
      getMultiplier(userId),
      getDiminishingReturnsFactor(userId),
    ]);

    const baseReward = act.reward_coins;
    const finalReward = calculateReward(baseReward, multiplier.multiplier);
    const adjustedReward = Math.max(1, Math.floor(finalReward * dimFactor));

    if (adjustedReward > 0) {
      await creditCoins(
        userId,
        adjustedReward,
        "activity_reward",
        "daily_activity",
        `ACT-SPK-${Date.now()}-${uuidv4().slice(0, 6)}`,
        {
          assignmentId,
          activityType: act.activity_type,
          streakDay: newStreakCount,
          baseReward,
          multiplier: multiplier.multiplier,
          dimFactor,
        }
      );
      coinsAwardedSPK = adjustedReward;
      await recordRewardEvent(userId, coinsAwardedSPK);
    }
  }

  return {
    success: true,
    isCorrect: true,
    coinsAwarded,
    coinsAwardedSPK,
    currentStreak: newStreakCount,
    longestStreak: newLongest,
    message: `Correct! You earned ${coinsAwarded} coins + ${coinsAwardedSPK} SPK. Streak: ${newStreakCount} days!`,
  };
}

/**
 * Get user's activity history.
 */
export async function getActivityHistory(userId: string, limit: number = 7) {
  const supabase = await createClient();

  const { data: completions } = await supabase
    .from("activity_completions")
    .select(`
      id,
      activity_type,
      coins_awarded,
      streak_day,
      completed_at,
      user_activity_assignments!inner (
        user_response,
        is_correct,
        daily_activities!inner (
          title,
          activity_type
        )
      )
    `)
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(limit);

  return (completions || []).map((c) => {
    const assignment = c.user_activity_assignments as unknown as {
      user_response: { answer: string } | null;
      is_correct: boolean | null;
      daily_activities: { title: string; activity_type: string };
    };
    return {
      id: c.id,
      activityType: c.activity_type,
      title: assignment.daily_activities.title,
      coinsAwarded: c.coins_awarded,
      streakDay: c.streak_day,
      completedAt: c.completed_at,
      userResponse: assignment.user_response?.answer || null,
      isCorrect: assignment.is_correct,
    };
  });
}
