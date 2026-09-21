import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateNewCandle } from "@/services/trading";

const VALID_TIMEFRAMES = ["1m", "5m", "15m", "1h"];

/**
 * Market simulation endpoint.
 * Can be called by a cron job or externally to advance the SPK price.
 * In production, use Vercel Cron or an external scheduler.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const timeframe = body.timeframe || "1m";

    if (!VALID_TIMEFRAMES.includes(timeframe)) {
      return NextResponse.json(
        { error: "Invalid timeframe" },
        { status: 400 }
      );
    }

    const candle = await generateNewCandle(timeframe);

    return NextResponse.json({
      success: true,
      price: candle.close,
      candle: {
        timestamp: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      },
    });
  } catch (error) {
    console.error("Market simulation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
