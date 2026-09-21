import { createClient } from "@/lib/supabase/server";

interface FraudCheck {
  userId: string;
  type: string;
  riskScore: number;
  reasons: string[];
  flagged: boolean;
}

export async function checkSuspiciousActivity(userId: string): Promise<FraudCheck> {
  const reasons: string[] = [];
  let riskScore = 0;

  const supabase = await createClient();

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();

  const { count: recentCompletions } = await supabase
    .from("streak_completions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("completed_at", oneHourAgo);

  if ((recentCompletions || 0) > 5) {
    reasons.push("Excessive streak completions in last hour");
    riskScore += 30;
  }

  const { count: failedPayments } = await supabase
    .from("payment_transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "failed")
    .gte("created_at", oneDayAgo);

  if ((failedPayments || 0) > 3) {
    reasons.push("Multiple failed payment attempts");
    riskScore += 25;
  }

  const { count: pendingWithdrawals } = await supabase
    .from("withdrawal_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["requested", "under_review"]);

  if ((pendingWithdrawals || 0) > 2) {
    reasons.push("Multiple pending withdrawals");
    riskScore += 20;
  }

  const { count: apiRequests } = await supabase
    .from("streak_completions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("completed_at", oneHourAgo);

  if ((apiRequests || 0) > 10) {
    reasons.push("High frequency API usage");
    riskScore += 15;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", userId)
    .single();

  if (profile?.verification_status === "rejected") {
    reasons.push("Previously rejected verification");
    riskScore += 40;
  }

  if (riskScore >= 50) {
    await supabase.from("notifications").insert({
      id: crypto.randomUUID(),
      user_id: userId,
      type: "security_alert",
      title: "Suspicious Activity Detected",
      message: "We detected unusual activity on your account. Please contact support if this was you.",
    });
  }

  return {
    userId,
    type: "activity_check",
    riskScore: Math.min(100, riskScore),
    reasons,
    flagged: riskScore >= 50,
  };
}

export async function checkDuplicateAccounts(email: string, ip?: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase.auth.admin.listUsers();

  return (data?.users?.filter((u) => u.email === email).length || 0) > 1;
}
