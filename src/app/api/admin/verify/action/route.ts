import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reviewVerification } from "@/services/admin/verification";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .single();

    if (!admin) return NextResponse.json({ error: "Not an admin" }, { status: 403 });

    const body = await request.json();
    const { userId, approved, notes } = body;

    if (!userId || typeof approved !== "boolean") {
      return NextResponse.json({ error: "userId and approved (boolean) are required" }, { status: 400 });
    }

    const result = await reviewVerification(userId, user.id, approved, notes);
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
