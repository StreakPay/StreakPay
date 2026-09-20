import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

export async function reviewVerification(
  userId: string,
  reviewerId: string,
  approved: boolean,
  notes?: string
) {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) throw new Error("User profile not found");

  const newStatus = approved ? "verified" : "rejected";

  await supabase
    .from("profiles")
    .update({ verification_status: newStatus })
    .eq("user_id", userId);

  await supabase
    .from("payment_proofs")
    .update({
      status: approved ? "approved" : "rejected",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      notes,
    })
    .eq("user_id", userId)
    .eq("status", "pending");

  await supabase.from("notifications").insert({
    id: uuidv4(),
    user_id: userId,
    type: approved ? "verification_approved" : "verification_rejected",
    title: approved ? "Verification Approved" : "Verification Rejected",
    message: approved
      ? "Your account has been verified. You now have full access to StreakPay."
      : `Your verification was rejected. ${notes || "Please contact support."}`,
  });

  await supabase.from("audit_logs").insert({
    id: uuidv4(),
    actor_id: reviewerId,
    actor_email: "admin",
    action: approved ? "ADMIN_APPROVED_VERIFICATION" : "ADMIN_REJECTED_VERIFICATION",
    target_id: userId,
    target_type: "user",
    previous_state: { verification_status: profile.verification_status },
    new_state: { verification_status: newStatus },
  });

  return { userId, status: newStatus };
}

export async function suspendUser(
  userId: string,
  adminId: string,
  reason: string
) {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) throw new Error("User not found");

  await supabase
    .from("profiles")
    .update({ verification_status: "suspended" })
    .eq("user_id", userId);

  await supabase.from("notifications").insert({
    id: uuidv4(),
    user_id: userId,
    type: "security_alert",
    title: "Account Suspended",
    message: `Your account has been suspended. Reason: ${reason}`,
  });

  await supabase.from("audit_logs").insert({
    id: uuidv4(),
    actor_id: adminId,
    actor_email: "admin",
    action: "ADMIN_SUSPENDED_USER",
    target_id: userId,
    target_type: "user",
    previous_state: { verification_status: profile.verification_status },
    new_state: { verification_status: "suspended", reason },
  });

  return { userId, status: "suspended" };
}
