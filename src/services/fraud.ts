import { db } from "@/lib/db";

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

  if (!db) return { userId, type: "check", riskScore: 0, reasons: [], flagged: false };

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);
  const oneDayAgo = new Date(now.getTime() - 86400000);

  const recentCompletions = await db.streakCompletion.count({
    where: {
      userId,
      completedAt: { gte: oneHourAgo },
    },
  });

  if (recentCompletions > 5) {
    reasons.push("Excessive streak completions in last hour");
    riskScore += 30;
  }

  const failedPayments = await db.paymentTransaction.count({
    where: {
      userId,
      status: "failed",
      createdAt: { gte: oneDayAgo },
    },
  });

  if (failedPayments > 3) {
    reasons.push("Multiple failed payment attempts");
    riskScore += 25;
  }

  const pendingWithdrawals = await db.withdrawalRequest.count({
    where: {
      userId,
      status: { in: ["requested", "under_review"] },
    },
  });

  if (pendingWithdrawals > 2) {
    reasons.push("Multiple pending withdrawals");
    riskScore += 20;
  }

  const apiRequests = await db.streakCompletion.count({
    where: {
      userId,
      completedAt: { gte: oneHourAgo },
    },
  });

  if (apiRequests > 10) {
    reasons.push("High frequency API usage");
    riskScore += 15;
  }

  const profile = await db.userProfile.findUnique({ where: { userId } });
  if (profile?.verificationStatus === "rejected") {
    reasons.push("Previously rejected verification");
    riskScore += 40;
  }

  if (riskScore >= 50) {
    await db.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type: "security_alert",
        title: "Suspicious Activity Detected",
        message: "We detected unusual activity on your account. Please contact support if this was you.",
      },
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
  if (!db) return false;

  const existingUser = await db.user.findUnique({ where: { email } });
  return !!existingUser;
}
