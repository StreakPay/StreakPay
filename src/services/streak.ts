import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

const ACTIVITY_CYCLE = [
  { activityType: "daily_engagement", title: "Daily Engagement", description: "Complete today's engagement activity" },
  { activityType: "daily_checkin", title: "Daily Check-in", description: "Check in to maintain your streak" },
  { activityType: "daily_quiz", title: "Daily Quiz", description: "Answer today's quiz question" },
  { activityType: "share_referral", title: "Share & Refer", description: "Share StreakPay with a friend" },
];

export async function getTodayTask(streakDay: number) {
  const dayIndex = streakDay % ACTIVITY_CYCLE.length;
  const activity = ACTIVITY_CYCLE[dayIndex];

  let task = await db?.streakTask.findFirst({
    where: { activityType: activity.activityType, dayNumber: dayIndex + 1 },
  });

  if (!task && db) {
    task = await db.streakTask.create({
      data: {
        id: uuidv4(),
        activityType: activity.activityType,
        dayNumber: dayIndex + 1,
        title: activity.title,
        description: activity.description,
      },
    });
  }

  return task || { ...activity, id: `task-${dayIndex + 1}`, dayNumber: dayIndex + 1, active: true };
}

export async function completeStreakTask(userId: string, taskId: string) {
  if (!db) throw new Error("Database not available");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingCompletion = await db.streakCompletion.findFirst({
    where: {
      userId,
      completedAt: {
        gte: today,
        lt: new Date(today.getTime() + 86400000),
      },
    },
  });

  if (existingCompletion) {
    throw new Error("Already completed today's task");
  }

  const streak = await db.streak.findUnique({ where: { userId } });
  if (!streak) throw new Error("Streak not found");

  const lastCompletion = streak.lastCompletionDate
    ? new Date(streak.lastCompletionDate)
    : null;

  let newStreakCount = streak.currentStreak;

  if (lastCompletion) {
    const lastDate = new Date(lastCompletion);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - lastDate.getTime()) / 86400000
    );

    if (diffDays === 1) {
      newStreakCount = streak.currentStreak + 1;
    } else if (diffDays > 1) {
      newStreakCount = 1;
    }
  } else {
    newStreakCount = 1;
  }

  const newLongest = Math.max(streak.longestStreak, newStreakCount);

  await db.streakCompletion.create({
    data: {
      id: uuidv4(),
      userId,
      streakId: streak.id,
      taskId,
      completedAt: new Date(),
      verified: true,
    },
  });

  await db.streak.update({
    where: { userId },
    data: {
      currentStreak: newStreakCount,
      longestStreak: newLongest,
      lastCompletionDate: new Date(),
    },
  });

  return {
    currentStreak: newStreakCount,
    longestStreak: newLongest,
    completed: true,
  };
}

export async function checkMilestoneEligibility(userId: string) {
  if (!db) return [];

  const streak = await db.streak.findUnique({ where: { userId } });
  if (!streak) return [];

  const milestones = await db.milestone.findMany({
    where: { active: true },
    orderBy: { requiredStreak: "asc" },
  });

  const claimed = await db.claimedMilestone.findMany({
    where: { userId },
  });

  const claimedIds = new Set(claimed.map((c: { milestoneId: string }) => c.milestoneId));

  return milestones.map((m: { id: string; requiredStreak: number; rewardAmount: unknown; currency: string; active: boolean }) => ({
    ...m,
    eligible: streak.currentStreak >= m.requiredStreak && !claimedIds.has(m.id),
    claimed: claimedIds.has(m.id),
  }));
}

export async function claimMilestone(userId: string, milestoneId: string) {
  if (!db) throw new Error("Database not available");

  const streak = await db.streak.findUnique({ where: { userId } });
  if (!streak) throw new Error("Streak not found");

  const milestone = await db.milestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) throw new Error("Milestone not found");
  if (!milestone.active) throw new Error("Milestone is not active");

  if (streak.currentStreak < milestone.requiredStreak) {
    throw new Error("Streak requirement not met");
  }

  const existingClaim = await db.claimedMilestone.findUnique({
    where: { userId_milestoneId: { userId, milestoneId } },
  });
  if (existingClaim) throw new Error("Milestone already claimed");

  return db.$transaction(async (tx: any) => {
    await tx.claimedMilestone.create({
      data: {
        id: uuidv4(),
        userId,
        streakId: streak.id,
        milestoneId,
      },
    });

    const wallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId, currency: "NGN" } },
    });

    if (wallet) {
      const newBalance = Number(wallet.balance) + Number(milestone.rewardAmount);
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await tx.ledgerEntry.create({
        data: {
          id: uuidv4(),
          userId,
          amount: Number(milestone.rewardAmount),
          currency: "NGN",
          direction: "credit",
          type: "milestone_reward",
          reference: `MS-${Date.now()}-${uuidv4().slice(0, 6)}`,
          source: "milestone_claim",
          status: "completed",
          metadata: { milestoneId, requiredStreak: milestone.requiredStreak },
        },
      });
    }

    return { success: true, rewardAmount: Number(milestone.rewardAmount) };
  });
}
