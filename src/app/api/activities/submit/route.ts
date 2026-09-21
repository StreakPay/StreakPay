import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitActivityResponse } from "@/services/activities";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { assignmentId, response } = body;

    if (!assignmentId || response === undefined || response === null) {
      return NextResponse.json({ error: "assignmentId and response are required" }, { status: 400 });
    }

    if (typeof response !== "string" || response.trim().length === 0) {
      return NextResponse.json({ error: "Response must be a non-empty string" }, { status: 400 });
    }

    const result = await submitActivityResponse(user.id, assignmentId, response.trim());

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Submit activity error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
