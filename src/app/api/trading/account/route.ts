import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTradingAccount } from "@/services/trading";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await getTradingAccount(session.user.id);

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Get trading account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
