import { createClient } from "@/lib/supabase/server";
import { safeNumber, clamp } from "@/lib/math";
import { getConfigValue } from "./coins";

export interface MultiplierState {
  multiplier: number;
  increasesToday: number;
  lastIncreaseAt: string | null;
}

export async function getMultiplier(userId: string): Promise<MultiplierState> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("coin_multiplier")
    .select("multiplier, increases_today, last_increase_at, last_reset_date")
    .eq("user_id", userId)
    .single();

  if (!data) {
    const { data: created } = await supabase
      .from("coin_multiplier")
      .insert({
        user_id: userId,
        multiplier: 1.0,
        increases_today: 0,
        last_reset_date: new Date().toISOString().split("T")[0],
      })
      .select("multiplier, increases_today, last_increase_at")
      .single();

    return {
      multiplier: safeNumber(created?.multiplier, 1.0),
      increasesToday: safeNumber(created?.increases_today),
      lastIncreaseAt: created?.last_increase_at || null,
    };
  }

  // Check if daily reset needed
  const lastReset = data.last_reset_date ? new Date(data.last_reset_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!lastReset || lastReset < today) {
    await supabase
      .from("coin_multiplier")
      .update({
        increases_today: 0,
        last_reset_date: today.toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return {
      multiplier: safeNumber(data.multiplier, 1.0),
      increasesToday: 0,
      lastIncreaseAt: data.last_increase_at,
    };
  }

  return {
    multiplier: safeNumber(data.multiplier, 1.0),
    increasesToday: safeNumber(data.increases_today),
    lastIncreaseAt: data.last_increase_at,
  };
}

export async function increaseMultiplier(
  userId: string,
): Promise<MultiplierState> {
  const supabase = await createClient();

  const maxMultiplier = await getConfigValue("max_multiplier");
  const step = await getConfigValue("multiplier_step");
  const maxIncreases = await getConfigValue("max_multiplier_increases_per_day");

  const effectiveMax = maxMultiplier > 0 ? maxMultiplier : 2.0;
  const effectiveStep = step > 0 ? step : 0.05;
  const effectiveMaxIncreases = maxIncreases > 0 ? maxIncreases : 10;

  const current = await getMultiplier(userId);

  // Already at max multiplier
  if (current.multiplier >= effectiveMax) {
    return current;
  }

  // Already hit daily increase limit
  if (current.increasesToday >= effectiveMaxIncreases) {
    return current;
  }

  const newMultiplier = clamp(
    current.multiplier + effectiveStep,
    1.0,
    effectiveMax
  );

  const { data } = await supabase
    .from("coin_multiplier")
    .update({
      multiplier: newMultiplier,
      increases_today: current.increasesToday + 1,
      last_increase_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("multiplier, increases_today, last_increase_at")
    .single();

  return {
    multiplier: safeNumber(data?.multiplier, current.multiplier),
    increasesToday: safeNumber(data?.increases_today, current.increasesToday + 1),
    lastIncreaseAt: data?.last_increase_at || new Date().toISOString(),
  };
}

/**
 * Calculate final reward using the formula: base × multiplier
 * NEVER produces NaN — safeNumber wraps all inputs.
 */
export function calculateReward(baseReward: number, multiplier: number): number {
  const safe = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
  const base = safe(baseReward);
  const mult = safe(multiplier);

  const result = base * mult;
  return Number.isFinite(result) ? Math.floor(result) : 0;
}
