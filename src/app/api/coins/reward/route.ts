import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { creditCoins } from "@/services/coins";
import {
  getMultiplier,
  calculateReward,
} from "@/services/multiplier";
import {
  checkRateLimit,
  checkDailyCap,
  checkDuplicateMessage,
  checkMultiplierLimits,
  getDiminishingReturnsFactor,
  recordRewardEvent,
  hashMessage,
} from "@/services/anti-abuse";
import { getConfigValue } from "@/services/coins";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Anti-abuse checks
    const [rateLimit, dailyCap] = await Promise.all([
      checkRateLimit(user.id),
      checkDailyCap(user.id),
    ]);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (!dailyCap.allowed) {
      return NextResponse.json(
        { error: "Daily coin cap reached. Come back tomorrow!" },
        { status: 429 }
      );
    }

    // Duplicate message check
    const msgHash = hashMessage(message);
    const isDuplicate = await checkDuplicateMessage(user.id, msgHash);
    if (isDuplicate) {
      return NextResponse.json(
        { error: "Similar message already rewarded recently." },
        { status: 429 }
      );
    }

    // Get multiplier and check limits
    const [multiplier, multiplierCheck] = await Promise.all([
      getMultiplier(user.id),
      checkMultiplierLimits(user.id),
    ]);

    // Calculate reward
    const baseReward = await getConfigValue("base_chat_reward");
    const effectiveBase = baseReward > 0 ? baseReward : 5;
    const finalReward = calculateReward(effectiveBase, multiplier.multiplier);

    // Apply diminishing returns
    const dimFactor = await getDiminishingReturnsFactor(user.id);
    const adjustedReward = Math.max(1, Math.floor(finalReward * dimFactor));

    // Credit coins
    const result = await creditCoins(
      user.id,
      adjustedReward,
      "chat_reward",
      "chat_message",
      `CHAT-${Date.now()}-${uuidv4().slice(0, 6)}`,
      {
        messageHash: msgHash,
        baseReward: effectiveBase,
        multiplier: multiplier.multiplier,
        dimFactor,
      }
    );

    // Record for rate limiting
    await recordRewardEvent(user.id, adjustedReward, msgHash);

    // Increase multiplier if allowed
    let newMultiplier = multiplier;
    if (multiplierCheck.allowed) {
      newMultiplier = await increaseMultiplierSafe(user.id);
    }

    return NextResponse.json({
      coinsAwarded: adjustedReward,
      balance: result.balance,
      multiplier: newMultiplier.multiplier,
    });
  } catch (error) {
    console.error("Chat reward error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function increaseMultiplierSafe(userId: string) {
  try {
    const { increaseMultiplier } = await import("@/services/multiplier");
    return await increaseMultiplier(userId);
  } catch {
    return { multiplier: 1.0, increasesToday: 0, lastIncreaseAt: null };
  }
}
