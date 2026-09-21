import { createClient } from "@/lib/supabase/server";
import { safeNumber } from "@/lib/math";
import { getConfigValue } from "./coins";

export interface AbuseCheckResult {
  allowed: boolean;
  reason: string;
}

/**
 * Check if user is within rate limits for earning coins.
 */
export async function checkRateLimit(userId: string): Promise<AbuseCheckResult> {
  const supabase = await createClient();

  const windowMinutes = await getConfigValue("rate_limit_window_minutes");
  const maxRewards = await getConfigValue("rate_limit_max_rewards");
  const maxCoins = await getConfigValue("rate_limit_max_coins");

  const effectiveWindow = windowMinutes > 0 ? windowMinutes : 60;
  const effectiveMaxRewards = maxRewards > 0 ? maxRewards : 20;
  const effectiveMaxCoins = maxCoins > 0 ? maxCoins : 200;

  const windowStart = new Date(Date.now() - effectiveWindow * 60000).toISOString();

  const { data: existing } = await supabase
    .from("coin_rate_limits")
    .select("id, reward_count, coins_earned, message_hashes")
    .eq("user_id", userId)
    .gte("window_start", windowStart)
    .order("window_start", { ascending: false })
    .limit(1)
    .single();

  if (!existing) {
    // No recent window — create one
    await supabase.from("coin_rate_limits").insert({
      user_id: userId,
      window_start: new Date().toISOString(),
      reward_count: 0,
      coins_earned: 0,
      message_hashes: [],
    });
    return { allowed: true, reason: "ok" };
  }

  if (safeNumber(existing.reward_count) >= effectiveMaxRewards) {
    return { allowed: false, reason: "rate_limit_exceeded" };
  }

  if (safeNumber(existing.coins_earned) >= effectiveMaxCoins) {
    return { allowed: false, reason: "daily_coin_cap_reached" };
  }

  return { allowed: true, reason: "ok" };
}

/**
 * Check if message is a duplicate within the cooldown window.
 * Returns true if the message has been seen recently.
 */
export async function checkDuplicateMessage(
  userId: string,
  messageHash: string
): Promise<boolean> {
  const supabase = await createClient();

  const cooldownMinutes = await getConfigValue("duplicate_message_window_minutes");
  const effectiveCooldown = cooldownMinutes > 0 ? cooldownMinutes : 30;

  const cutoff = new Date(Date.now() - effectiveCooldown * 60000).toISOString();

  const { data: recent } = await supabase
    .from("coin_rate_limits")
    .select("message_hashes")
    .eq("user_id", userId)
    .gte("window_start", cutoff)
    .order("window_start", { ascending: false })
    .limit(5);

  if (!recent) return false;

  for (const row of recent) {
    const hashes = (row.message_hashes as string[]) || [];
    if (hashes.includes(messageHash)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user has hit their daily coin earning cap.
 */
export async function checkDailyCap(userId: string): Promise<AbuseCheckResult> {
  const supabase = await createClient();

  const dailyCap = await getConfigValue("daily_coin_cap");
  const effectiveCap = dailyCap > 0 ? dailyCap : 500;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("coin_transactions")
    .select("amount")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString())
    .gt("amount", 0);

  if (!data) return { allowed: true, reason: "ok" };

  const totalToday = data.reduce((sum, row) => sum + safeNumber(row.amount), 0);

  if (totalToday >= effectiveCap) {
    return { allowed: false, reason: "daily_cap_reached" };
  }

  return { allowed: true, reason: "ok" };
}

/**
 * Check if user can increase their multiplier today.
 */
export async function checkMultiplierLimits(
  userId: string
): Promise<AbuseCheckResult> {
  const supabase = await createClient();

  const maxIncreases = await getConfigValue("max_multiplier_increases_per_day");
  const effectiveMax = maxIncreases > 0 ? maxIncreases : 10;

  const { data } = await supabase
    .from("coin_multiplier")
    .select("increases_today, last_reset_date")
    .eq("user_id", userId)
    .single();

  if (!data) return { allowed: true, reason: "ok" };

  // Check daily reset
  const lastReset = data.last_reset_date ? new Date(data.last_reset_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lastReset && lastReset < today) {
    return { allowed: true, reason: "ok" };
  }

  if (safeNumber(data.increases_today) >= effectiveMax) {
    return { allowed: false, reason: "multiplier_increase_limit_reached" };
  }

  return { allowed: true, reason: "ok" };
}

/**
 * Calculate diminishing returns based on recent reward count.
 * Returns a multiplier between 0.5 and 1.0.
 */
export async function getDiminishingReturnsFactor(
  userId: string
): Promise<number> {
  const threshold = await getConfigValue("diminishing_returns_threshold");
  const effectiveThreshold = threshold > 0 ? threshold : 5;

  const supabase = await createClient();

  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  const { count } = await supabase
    .from("coin_transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneHourAgo)
    .gt("amount", 0);

  const recentCount = safeNumber(count);

  if (recentCount <= effectiveThreshold) return 1.0;

  // Diminish by 50% beyond threshold
  return 0.5;
}

/**
 * Record a reward event for rate limiting.
 */
export async function recordRewardEvent(
  userId: string,
  coinsEarned: number,
  messageHash?: string
): Promise<void> {
  const supabase = await createClient();

  const windowStart = new Date().toISOString();

  // Find existing window or create new
  const { data: existing } = await supabase
    .from("coin_rate_limits")
    .select("id, reward_count, coins_earned, message_hashes")
    .eq("user_id", userId)
    .order("window_start", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    const currentHashes = (existing.message_hashes as string[]) || [];
    const newHashes = messageHash
      ? [...currentHashes, messageHash].slice(-100)
      : currentHashes;

    await supabase
      .from("coin_rate_limits")
      .update({
        reward_count: safeNumber(existing.reward_count) + 1,
        coins_earned: safeNumber(existing.coins_earned) + coinsEarned,
        message_hashes: newHashes,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("coin_rate_limits").insert({
      user_id: userId,
      window_start: windowStart,
      reward_count: 1,
      coins_earned: coinsEarned,
      message_hashes: messageHash ? [messageHash] : [],
    });
  }
}

/**
 * Simple hash function for messages to detect duplicates.
 * Not cryptographic — just fast and good enough for spam detection.
 */
export function hashMessage(text: string): string {
  let hash = 0;
  const str = text.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `h_${Math.abs(hash).toString(36)}`;
}
