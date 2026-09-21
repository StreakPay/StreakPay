import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMultiplier } from "@/services/multiplier";
import { getAllConfig } from "@/services/coins";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [multiplier, config] = await Promise.all([
      getMultiplier(user.id),
      getAllConfig(),
    ]);

    return NextResponse.json({
      multiplier: multiplier.multiplier,
      increasesToday: multiplier.increasesToday,
      maxMultiplier: config.max_multiplier || 2.0,
      maxIncreasesPerDay: config.max_multiplier_increases_per_day || 10,
      multiplierStep: config.multiplier_step || 0.05,
    });
  } catch (error) {
    console.error("Get multiplier error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
