import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCoinHistory } from "@/services/coins";

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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const type = searchParams.get("type") || undefined;

    const history = await getCoinHistory(user.id, { limit, offset, type });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Get coin history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
