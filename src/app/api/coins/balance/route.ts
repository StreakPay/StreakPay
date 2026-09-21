import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCoinBalance, getCoinsEarnedToday } from "@/services/coins";
import { getMultiplier } from "@/services/multiplier";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [balance, earnedToday, multiplier] = await Promise.all([
      getCoinBalance(user.id),
      getCoinsEarnedToday(user.id),
      getMultiplier(user.id),
    ]);

    return NextResponse.json({
      balance: balance.balance,
      totalEarned: balance.totalEarned,
      totalSpent: balance.totalSpent,
      earnedToday,
      multiplier: multiplier.multiplier,
    });
  } catch (error) {
    console.error("Get coin balance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
