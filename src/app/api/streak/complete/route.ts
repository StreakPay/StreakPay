import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completeStreakTask, getTodayTask } from "@/services/streak";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: streak } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const task = await getTodayTask(streak?.current_streak || 0);
    const result = await completeStreakTask(user.id, task.id);

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
