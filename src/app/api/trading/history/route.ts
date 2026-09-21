import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      100
    );

    const { data: account } = await supabase
      .from("trading_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ history: [] });
    }

    const { data: orders } = await supabase
      .from("trading_orders")
      .select("id, side, symbol, quantity, price, status, executed_at, created_at")
      .eq("trading_account_id", account.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    return NextResponse.json({ history: orders || [] });
  } catch (error) {
    console.error("Get trade history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
