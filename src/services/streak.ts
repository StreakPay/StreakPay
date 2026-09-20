import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

const ACTIVITY_CYCLE = [
  { activityType: "daily_engagement", title: "Daily Engagement", description: "Complete today's engagement activity" },
  { activityType: "daily_checkin", title: "Daily Check-in", description: "Check in to maintain your streak" },
  { activityType: "daily_quiz", title: "Daily Quiz", description: "Answer today's quiz question" },
  { activityType: "share_referral", title: "Share & Refer", description: "Share StreakPay with a friend" },
];

export async function getTodayTask(streakDay: number) {
  const supabase = await createClient();
  const dayIndex = streakDay % ACTIVITY_CYCLE.length;
  const activity = ACTIVITY_CYCLE[dayIndex];

  const { data: task } = await supabase
    .from("streak_tasks")
    .select("*")
    .eq("activity_type", activity.activityType)
    .eq("day_number", dayIndex + 1)
    .single();

  if (task) return task;

  const { data: newTask } = await supabase
    .from("streak_tasks")
    .insert({
      activity_type: activity.activityType,
      day_number: dayIndex + 1,
      title: activity.title,
      description: activity.description,
    })
    .select()
    .single();

  return newTask || { ...activity, id: `task-${dayIndex + 1}`, day_number: dayIndex + 1, active: true };
}

export async function completeStreakTask(userId: string, taskId: string) {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today.getTime() + 86400000);

  const { data: existingCompletion } = await supabase
    .from("streak_completions")
    .select("id")
    .eq("user_id", userId)
    .gte("completed_at", today.toISOString())
    .lt("completed_at", todayEnd.toISOString())
    .limit(1);

  if (existingCompletion && existingCompletion.length > 0) {
    throw new Error("Already completed today's task");
  }

  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!streak) throw new Error("Streak not found");

  const lastCompletion = streak.last_completion_date ? new Date(streak.last_completion_date) : null;
  let newStreakCount = streak.current_streak;

  if (lastCompletion) {
    const lastDate = new Date(lastCompletion);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);

    if (diffDays === 1) {
      newStreakCount = streak.current_streak + 1;
    } else if (diffDays > 1) {
      newStreakCount = 1;
    }
  } else {
    newStreakCount = 1;
  }

  const newLongest = Math.max(streak.longest_streak, newStreakCount);

  await supabase.from("streak_completions").insert({
    user_id: userId,
    streak_id: streak.id,
    task_id: taskId,
    completed_at: new Date().toISOString(),
    verified: true,
  });

  await supabase
    .from("streaks")
    .update({
      current_streak: newStreakCount,
      longest_streak: newLongest,
      last_completion_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return { currentStreak: newStreakCount, longestStreak: newLongest, completed: true };
}

export async function checkMilestoneEligibility(userId: string) {
  const supabase = await createClient();

  const { data: streak } = await supabase
    .from("streaks")
    .select("current_streak")
    .eq("user_id", userId)
    .single();

  if (!streak) return [];

  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("active", true)
    .order("required_streak", { ascending: true });

  if (!milestones) return [];

  const { data: claimed } = await supabase
    .from("claimed_milestones")
    .select("milestone_id")
    .eq("user_id", userId);

  const claimedIds = new Set(claimed?.map((c) => c.milestone_id) || []);

  return milestones.map((m) => ({
    ...m,
    eligible: streak.current_streak >= m.required_streak && !claimedIds.has(m.id),
    claimed: claimedIds.has(m.id),
  }));
}

export async function claimMilestone(userId: string, milestoneId: string) {
  const supabase = await createClient();

  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!streak) throw new Error("Streak not found");

  const { data: milestone } = await supabase
    .from("milestones")
    .select("*")
    .eq("id", milestoneId)
    .single();

  if (!milestone) throw new Error("Milestone not found");
  if (!milestone.active) throw new Error("Milestone is not active");
  if (streak.current_streak < milestone.required_streak) {
    throw new Error("Streak requirement not met");
  }

  const { data: existingClaim } = await supabase
    .from("claimed_milestones")
    .select("id")
    .eq("user_id", userId)
    .eq("milestone_id", milestoneId)
    .limit(1);

  if (existingClaim && existingClaim.length > 0) {
    throw new Error("Milestone already claimed");
  }

  await supabase.from("claimed_milestones").insert({
    user_id: userId,
    streak_id: streak.id,
    milestone_id: milestoneId,
  });

  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("currency", "NGN")
    .single();

  if (wallet) {
    const newBalance = Number(wallet.balance) + Number(milestone.reward_amount);
    await supabase
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);

    await supabase.from("ledger_entries").insert({
      user_id: userId,
      amount: Number(milestone.reward_amount),
      currency: "NGN",
      direction: "credit",
      type: "milestone_reward",
      reference: `MS-${Date.now()}-${uuidv4().slice(0, 6)}`,
      source: "milestone_claim",
      status: "completed",
      metadata: { milestoneId, requiredStreak: milestone.required_streak },
    });
  }

  return { success: true, rewardAmount: Number(milestone.reward_amount) };
}
