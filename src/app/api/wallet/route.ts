import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWalletBalance } from "@/services/wallet";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balance = await getWalletBalance(user.id, "NGN");

    return NextResponse.json({ balance, currency: "NGN" });
  } catch (error) {
    console.error("Get wallet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
