import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLedgerEntries } from "@/services/wallet";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type") || undefined;

    const entries = await getLedgerEntries(session.user.id, { limit, type });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Get ledger error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
