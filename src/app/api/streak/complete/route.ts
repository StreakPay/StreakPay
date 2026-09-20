import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { completeStreakTask, getTodayTask } from "@/services/streak";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const streak = await db?.streak.findUnique({ where: { userId: session.user.id } });
    const task = await getTodayTask(streak?.currentStreak || 0);
    const result = await completeStreakTask(session.user.id, task.id);

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Complete streak error:", error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
