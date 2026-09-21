import { NextResponse } from "next/server";
import { getCandles } from "@/services/trading";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "1m";
    const limit = Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1);

    const candles = await getCandles(timeframe, limit);

    return NextResponse.json({ candles });
  } catch (error) {
    console.error("Get candles error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
