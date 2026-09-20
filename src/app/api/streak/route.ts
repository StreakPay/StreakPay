import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTodayTask } from "@/services/streak";

export async function GET() {
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

    const todayTask = await getTodayTask(streak?.current_streak || 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: todayCompletion } = await supabase
      .from("streak_completions")
      .select("id")
      .eq("user_id", user.id)
      .gte("completed_at", today.toISOString())
      .lt("completed_at", new Date(today.getTime() + 86400000).toISOString())
      .limit(1)
      .single();

    return NextResponse.json({
      streak: streak || { current_streak: 0, longest_streak: 0 },
      todayTask,
      completedToday: !!todayCompletion,
    });
  } catch (error) {
    console.error("Get streak error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
