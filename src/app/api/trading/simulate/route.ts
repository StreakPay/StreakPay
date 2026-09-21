import { NextResponse } from "next/server";
import { generateNewCandle } from "@/services/trading";

/**
 * Market simulation endpoint.
 * Can be called by a cron job or externally to advance the SPK price.
 * In production, use Vercel Cron or an external scheduler.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const timeframe = body.timeframe || "1m";

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
