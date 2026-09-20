import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getWalletBalance } from "@/services/wallet";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balance = await getWalletBalance(session.user.id, "NGN");

    return NextResponse.json({ balance, currency: "NGN" });
  } catch (error) {
    console.error("Get wallet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
