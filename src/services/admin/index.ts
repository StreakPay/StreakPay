import { createClient } from "@/lib/supabase/server";

interface WalletRow {
  balance: number | null;
}

interface AmountRow {
  amount: number | null;
}

export async function getAdminStats() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: verifiedUsers },
    { count: pendingVerification },
    { count: pendingWithdrawals },
    { data: rewardAgg },
    { data: withdrawalAgg },
    { data: paymentAgg },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "verified"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("verification_status", ["payment_pending", "proof_submitted", "under_review"]),
    supabase
      .from("withdrawal_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["requested", "under_review", "approved"]),
    supabase
      .from("wallets")
      .select("balance")
      .eq("currency", "NGN"),
    supabase
      .from("withdrawal_requests")
      .select("amount")
      .in("status", ["requested", "under_review", "approved", "processing"]),
    supabase
      .from("payment_transactions")
      .select("amount")
      .eq("status", "success"),
  ]);

  const totalRewardLiability = (rewardAgg as WalletRow[] || []).reduce(
    (sum, r) => sum + Number(r.balance || 0),
    0
  );
  const withdrawalLiability = (withdrawalAgg as AmountRow[] || []).reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0
  );
  const totalPaymentVolume = (paymentAgg as AmountRow[] || []).reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0
  );

  return {
    totalUsers: totalUsers || 0,
    verifiedUsers: verifiedUsers || 0,
    pendingVerification: pendingVerification || 0,
    pendingWithdrawals: pendingWithdrawals || 0,
    totalRewardLiability,
    withdrawalLiability,
    totalPaymentVolume,
  };
}

export async function getAllUsers(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.search) {
    query = query.or(`full_name.ilike.%${options.search}%`);
  }

  if (options?.status) {
    query = query.eq("verification_status", options.status);
  }

  const from = options?.offset || 0;
  const to = from + (options?.limit || 50) - 1;

  const { data } = await query.range(from, to);

  return data || [];
}

export async function getPendingVerifications() {
  const supabase = await createClient();

  const { data: proofs } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!proofs || proofs.length === 0) return [];

  const userIds = [...new Set(proofs.map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  return proofs.map((proof) => ({
    ...proof,
    user: { id: proof.user_id, email: "", profile: profileMap.get(proof.user_id) || null },
  }));
}

export async function getPendingWithdrawals() {
  const supabase = await createClient();

  const { data: withdrawals } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .in("status", ["requested", "under_review"])
    .order("created_at", { ascending: true });

  if (!withdrawals || withdrawals.length === 0) return [];

  const userIds = [...new Set(withdrawals.map((w) => w.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  return withdrawals.map((w) => ({
    ...w,
    user: { id: w.user_id, email: "", profile: profileMap.get(w.user_id) || null },
  }));
}

export async function getAuditLogs(options?: { limit?: number; offset?: number }) {
  const supabase = await createClient();

  const from = options?.offset || 0;
  const to = from + (options?.limit || 50) - 1;

  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  return data || [];
}
