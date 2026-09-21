import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { safeNumber } from "@/lib/math";

export interface CoinBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  type: string;
  source: string;
  reference: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function getCoinBalance(userId: string): Promise<CoinBalance> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("coin_balances")
    .select("balance, total_earned, total_spent")
    .eq("user_id", userId)
    .single();

  if (!data) {
    const { data: created } = await supabase
      .from("coin_balances")
      .insert({ user_id: userId, balance: 0, total_earned: 0, total_spent: 0 })
      .select("balance, total_earned, total_spent")
      .single();
    return {
      balance: safeNumber(created?.balance),
      totalEarned: safeNumber(created?.total_earned),
      totalSpent: safeNumber(created?.total_spent),
    };
  }

  return {
    balance: safeNumber(data.balance),
    totalEarned: safeNumber(data.total_earned),
    totalSpent: safeNumber(data.total_spent),
  };
}

export async function creditCoins(
  userId: string,
  amount: number,
  type: string,
  source: string,
  reference?: string,
  metadata?: Record<string, unknown>
): Promise<{ balance: number; transaction: CoinTransaction }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid coin amount");
  }

  const intAmount = Math.floor(amount);
  const supabase = await createClient();
  const ref = reference || `COIN-${Date.now()}-${uuidv4().slice(0, 6)}`;

  // Get current balance (or create)
  let { data: existing } = await supabase
    .from("coin_balances")
    .select("balance, total_earned")
    .eq("user_id", userId)
    .single();

  if (!existing) {
    const { data: created } = await supabase
      .from("coin_balances")
      .insert({ user_id: userId, balance: 0, total_earned: 0, total_spent: 0 })
      .select("balance, total_earned")
      .single();
    existing = created;
  }

  const currentBalance = safeNumber(existing?.balance);
  const newBalance = currentBalance + intAmount;
  const currentTotalEarned = safeNumber(existing?.total_earned);
  const newTotalEarned = currentTotalEarned + intAmount;

  // Update balance
  await supabase
    .from("coin_balances")
    .update({
      balance: newBalance,
      total_earned: newTotalEarned,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  // Record transaction
  const { data: txn } = await supabase
    .from("coin_transactions")
    .insert({
      user_id: userId,
      amount: intAmount,
      balance_after: newBalance,
      type,
      source,
      reference: ref,
      metadata: metadata || null,
    })
    .select("id, amount, balance_after, type, source, reference, metadata, created_at")
    .single();

  return {
    balance: newBalance,
    transaction: {
      id: txn!.id,
      amount: txn!.amount,
      balanceAfter: txn!.balance_after,
      type: txn!.type,
      source: txn!.source,
      reference: txn!.reference,
      metadata: txn!.metadata as Record<string, unknown> | null,
      createdAt: txn!.created_at,
    },
  };
}

export async function debitCoins(
  userId: string,
  amount: number,
  type: string,
  source: string,
  reference?: string,
  metadata?: Record<string, unknown>
): Promise<{ balance: number; transaction: CoinTransaction }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid coin amount");
  }

  const intAmount = Math.floor(amount);
  const supabase = await createClient();
  const ref = reference || `COIN-DEBIT-${Date.now()}-${uuidv4().slice(0, 6)}`;

  const { data: existing } = await supabase
    .from("coin_balances")
    .select("balance, total_spent")
    .eq("user_id", userId)
    .single();

  if (!existing) throw new Error("Coin balance not found");
  if (safeNumber(existing.balance) < intAmount) {
    throw new Error("Insufficient coins");
  }

  const newBalance = safeNumber(existing.balance) - intAmount;
  const newTotalSpent = safeNumber(existing.total_spent) + intAmount;

  await supabase
    .from("coin_balances")
    .update({
      balance: newBalance,
      total_spent: newTotalSpent,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  const { data: txn } = await supabase
    .from("coin_transactions")
    .insert({
      user_id: userId,
      amount: -intAmount,
      balance_after: newBalance,
      type,
      source,
      reference: ref,
      metadata: metadata || null,
    })
    .select("id, amount, balance_after, type, source, reference, metadata, created_at")
    .single();

  return {
    balance: newBalance,
    transaction: {
      id: txn!.id,
      amount: txn!.amount,
      balanceAfter: txn!.balance_after,
      type: txn!.type,
      source: txn!.source,
      reference: txn!.reference,
      metadata: txn!.metadata as Record<string, unknown> | null,
      createdAt: txn!.created_at,
    },
  };
}

export async function getCoinHistory(
  userId: string,
  options?: { limit?: number; offset?: number; type?: string }
): Promise<CoinTransaction[]> {
  const supabase = await createClient();

  let query = supabase
    .from("coin_transactions")
    .select("id, amount, balance_after, type, source, reference, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(
      options?.offset || 0,
      (options?.offset || 0) + (options?.limit || 50) - 1
    );

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  const { data } = await query;

  return (data || []).map((row) => ({
    id: row.id,
    amount: row.amount,
    balanceAfter: row.balance_after,
    type: row.type,
    source: row.source,
    reference: row.reference,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.created_at,
  }));
}

export async function getCoinsEarnedToday(userId: string): Promise<number> {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("coin_transactions")
    .select("amount")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString())
    .gt("amount", 0);

  if (!data) return 0;

  return data.reduce((sum, row) => sum + safeNumber(row.amount), 0);
}

export async function getConfigValue(key: string): Promise<number> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("coin_config")
    .select("value")
    .eq("key", key)
    .single();

  return safeNumber(data?.value);
}

export async function getAllConfig(): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("coin_config")
    .select("key, value");

  const config: Record<string, number> = {};
  for (const row of data || []) {
    config[row.key] = safeNumber(row.value);
  }
  return config;
}
