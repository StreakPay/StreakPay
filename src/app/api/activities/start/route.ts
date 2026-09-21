import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startActivity } from "@/services/activities";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
    }

    await startActivity(user.id, assignmentId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Start activity error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
