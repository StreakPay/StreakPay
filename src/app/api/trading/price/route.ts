import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/services/trading";

export async function GET() {
  try {
    const price = await getCurrentPrice();
    return NextResponse.json({ price, symbol: "SPK" });
  } catch (error) {
    console.error("Get price error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
