import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTodayTask } from "@/services/streak";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const streak = await db?.streak.findUnique({ where: { userId } });
    const todayTask = await getTodayTask(streak?.currentStreak || 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCompletion = await db?.streakCompletion.findFirst({
      where: {
        userId,
        completedAt: {
          gte: today,
          lt: new Date(today.getTime() + 86400000),
        },
      },
    });

    return NextResponse.json({
      streak: streak || { currentStreak: 0, longestStreak: 0 },
      todayTask,
      completedToday: !!todayCompletion,
    });
  } catch (error) {
    console.error("Get streak error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
