import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTradingAccount } from "@/services/trading";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await getTradingAccount(user.id);

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Get trading account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
