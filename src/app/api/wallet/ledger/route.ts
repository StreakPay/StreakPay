import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLedgerEntries } from "@/services/wallet";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type") || undefined;

    const entries = await getLedgerEntries(user.id, { limit, type });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Get ledger error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
