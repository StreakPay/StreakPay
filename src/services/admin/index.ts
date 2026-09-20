import { createClient } from "@/lib/supabase/server";

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

  const totalRewardLiability = (rewardAgg || []).reduce(
    (sum: number, r: any) => sum + Number(r.balance || 0),
    0
  );
  const withdrawalLiability = (withdrawalAgg || []).reduce(
    (sum: number, r: any) => sum + Number(r.amount || 0),
    0
  );
  const totalPaymentVolume = (paymentAgg || []).reduce(
    (sum: number, r: any) => sum + Number(r.amount || 0),
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
    .select("*, user_streaks(*), wallets(*)")
    .order("created_at", { ascending: false });

  if (options?.search) {
    query = query.or(`full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
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

  const { data } = await supabase
    .from("payment_proofs")
    .select("*, profiles(user_id, full_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return data || [];
}

export async function getPendingWithdrawals() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("withdrawal_requests")
    .select("*, profiles(user_id, full_name, email)")
    .in("status", ["requested", "under_review"])
    .order("created_at", { ascending: true });

  return data || [];
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
