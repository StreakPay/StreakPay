import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { approveWithdrawal, rejectWithdrawal } from "@/services/admin/withdrawals";

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
    const { withdrawalId, action, reason } = body;

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: "withdrawalId and action are required" }, { status: 400 });
    }

    let result;
    if (action === "approve") {
      result = await approveWithdrawal(withdrawalId, user.id);
    } else if (action === "reject") {
      result = await rejectWithdrawal(withdrawalId, user.id, reason);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, withdrawal: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
