import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkMilestoneEligibility, claimMilestone } from "@/services/streak";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const milestones = await checkMilestoneEligibility(user.id);

    return NextResponse.json({ milestones });
  } catch (error) {
    console.error("Get milestones error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { milestoneId } = body;

    if (!milestoneId) {
      return NextResponse.json({ error: "milestoneId is required" }, { status: 400 });
    }

    const result = await claimMilestone(user.id, milestoneId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Claim milestone error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
