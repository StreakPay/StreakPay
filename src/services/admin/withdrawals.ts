import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

export async function requestWithdrawal(
  userId: string,
  amount: number,
  bankName: string,
  accountNumber: string,
  accountName: string
) {
  const supabase = await createClient();

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("currency", "NGN")
    .single();

  if (walletError || !wallet) throw new Error("Wallet not found");
  if (Number(wallet.balance) < amount) throw new Error("Insufficient balance");
  if (amount < 500) throw new Error("Minimum withdrawal is ₦500");

  const { count: pendingWithdrawals } = await supabase
    .from("withdrawal_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["requested", "under_review", "approved", "processing"]);

  if ((pendingWithdrawals || 0) > 0) {
    throw new Error("You have a pending withdrawal request");
  }

  const reference = `WD-${Date.now()}-${uuidv4().slice(0, 6)}`;
  const newBalance = Number(wallet.balance) - amount;

  await supabase
    .from("wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", wallet.id);

  await supabase.from("ledger_entries").insert({
    id: uuidv4(),
    user_id: userId,
    amount,
    currency: "NGN",
    direction: "debit",
    type: "withdrawal_debit",
    reference,
    source: "withdrawal_request",
    status: "pending",
  });

  const { data: withdrawal } = await supabase
    .from("withdrawal_requests")
    .insert({
      id: uuidv4(),
      user_id: userId,
      amount,
      currency: "NGN",
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      reference,
      status: "requested",
    })
    .select()
    .single();

  return withdrawal;
}

export async function getWithdrawalHistory(userId: string, limit: number = 20) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function approveWithdrawal(
  withdrawalId: string,
  reviewerId: string
) {
  const supabase = await createClient();

  const { data: withdrawal, error } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("id", withdrawalId)
    .single();

  if (error || !withdrawal) throw new Error("Withdrawal not found");
  if (withdrawal.status !== "requested" && withdrawal.status !== "under_review") {
    throw new Error("Withdrawal cannot be approved");
  }

  const { data: updated } = await supabase
    .from("withdrawal_requests")
    .update({
      status: "approved",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", withdrawalId)
    .select()
    .single();

  const { data: reviewer } = await supabase.auth.admin.getUserById(reviewerId);
  await supabase.from("audit_logs").insert({
    id: uuidv4(),
    actor_id: reviewerId,
    actor_email: reviewer?.user?.email || "admin",
    action: "ADMIN_APPROVED_WITHDRAWAL",
    target_id: withdrawalId,
    target_type: "withdrawal",
    previous_state: { status: withdrawal.status },
    new_state: { status: "approved" },
  });

  return updated;
}

export async function rejectWithdrawal(
  withdrawalId: string,
  reviewerId: string,
  reason?: string
) {
  const supabase = await createClient();

  const { data: withdrawal, error } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("id", withdrawalId)
    .single();

  if (error || !withdrawal) throw new Error("Withdrawal not found");

  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", withdrawal.user_id)
    .eq("currency", "NGN")
    .single();

  if (wallet) {
    await supabase
      .from("wallets")
      .update({ balance: Number(wallet.balance) + Number(withdrawal.amount), updated_at: new Date().toISOString() })
      .eq("id", wallet.id);

    await supabase.from("ledger_entries").insert({
      id: uuidv4(),
      user_id: withdrawal.user_id,
      amount: Number(withdrawal.amount),
      currency: "NGN",
      direction: "credit",
      type: "reversal",
      reference: `REV-${withdrawal.reference}`,
      source: "withdrawal_rejection",
      status: "completed",
    });
  }

  const { data: updated } = await supabase
    .from("withdrawal_requests")
    .update({
      status: "rejected",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { reason },
    })
    .eq("id", withdrawalId)
    .select()
    .single();

  const { data: reviewer2 } = await supabase.auth.admin.getUserById(reviewerId);
  await supabase.from("audit_logs").insert({
    id: uuidv4(),
    actor_id: reviewerId,
    actor_email: reviewer2?.user?.email || "admin",
    action: "ADMIN_REJECTED_WITHDRAWAL",
    target_id: withdrawalId,
    target_type: "withdrawal",
    previous_state: { status: withdrawal.status },
    new_state: { status: "rejected", reason },
  });

  return updated;
}
