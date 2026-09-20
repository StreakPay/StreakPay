import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

export async function getOrCreateWallet(userId: string, currency: string = "NGN") {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("currency", currency)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("wallets")
    .insert({ user_id: userId, currency, balance: 0 })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function creditWallet(
  userId: string,
  amount: number,
  currency: string,
  type: string,
  source: string,
  reference?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  const ref = reference || `ref_${uuidv4().slice(0, 8)}`;

  // Get current wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("currency", currency)
    .single();

  if (!wallet) throw new Error("Wallet not found");

  const newBalance = Number(wallet.balance) + amount;

  // Update balance
  await supabase
    .from("wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", wallet.id);

  // Create ledger entry
  const { data: ledgerEntry } = await supabase
    .from("ledger_entries")
    .insert({
      user_id: userId,
      amount,
      currency,
      direction: "credit",
      type,
      reference: ref,
      source,
      status: "completed",
      metadata,
    })
    .select()
    .single();

  return { wallet: { ...wallet, balance: newBalance }, ledgerEntry };
}

export async function debitWallet(
  userId: string,
  amount: number,
  currency: string,
  type: string,
  source: string,
  reference?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  const ref = reference || `ref_${uuidv4().slice(0, 8)}`;

  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("currency", currency)
    .single();

  if (!wallet) throw new Error("Wallet not found");
  if (Number(wallet.balance) < amount) throw new Error("Insufficient balance");

  const newBalance = Number(wallet.balance) - amount;

  await supabase
    .from("wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", wallet.id);

  const { data: ledgerEntry } = await supabase
    .from("ledger_entries")
    .insert({
      user_id: userId,
      amount,
      currency,
      direction: "debit",
      type,
      reference: ref,
      source,
      status: "completed",
      metadata,
    })
    .select()
    .single();

  return { wallet: { ...wallet, balance: newBalance }, ledgerEntry };
}

export async function getWalletBalance(userId: string, currency: string = "NGN") {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .eq("currency", currency)
    .single();

  return data ? Number(data.balance) : 0;
}

export async function getLedgerEntries(
  userId: string,
  options?: { limit?: number; offset?: number; type?: string }
) {
  const supabase = await createClient();

  let query = supabase
    .from("ledger_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50) - 1);

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  const { data } = await query;
  return data || [];
}
