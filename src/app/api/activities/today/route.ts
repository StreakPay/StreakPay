import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTodayActivity } from "@/services/activities";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activity = await getTodayActivity(user.id);

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Get today activity error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
