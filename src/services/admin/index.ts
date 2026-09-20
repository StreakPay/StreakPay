import { db } from "@/lib/db";

export async function getAdminStats() {
  if (!db) {
    return {
      totalUsers: 0,
      verifiedUsers: 0,
      pendingVerification: 0,
      totalRewardLiability: 0,
      pendingWithdrawals: 0,
      withdrawalLiability: 0,
      totalPaymentVolume: 0,
    };
  }

  const [
    totalUsers,
    verifiedUsers,
    pendingVerification,
    pendingWithdrawals,
    rewardAgg,
    withdrawalAgg,
    paymentAgg,
  ] = await Promise.all([
    db.user.count(),
    db.userProfile.count({ where: { verificationStatus: "verified" } }),
    db.userProfile.count({
      where: {
        verificationStatus: { in: ["payment_pending", "proof_submitted", "under_review"] },
      },
    }),
    db.withdrawalRequest.count({
      where: { status: { in: ["requested", "under_review", "approved"] } },
    }),
    db.wallet.aggregate({ _sum: { balance: true }, where: { currency: "NGN" } }),
    db.withdrawalRequest.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["requested", "under_review", "approved", "processing"] } },
    }),
    db.paymentTransaction.aggregate({
      _sum: { amount: true },
      where: { status: "success" },
    }),
  ]);

  return {
    totalUsers,
    verifiedUsers,
    pendingVerification,
    pendingWithdrawals,
    totalRewardLiability: Number(rewardAgg._sum.balance || 0),
    withdrawalLiability: Number(withdrawalAgg._sum.amount || 0),
    totalPaymentVolume: Number(paymentAgg._sum.amount || 0),
  };
}

export async function getAllUsers(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
}) {
  if (!db) return [];

  const where: any = {};
  if (options?.search) {
    where.OR = [
      { email: { contains: options.search, mode: "insensitive" } },
      { profile: { fullName: { contains: options.search, mode: "insensitive" } } },
    ];
  }
  if (options?.status) {
    where.profile = { verificationStatus: options.status };
  }

  return db.user.findMany({
    where,
    include: { profile: true, streak: true },
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

export async function getPendingVerifications() {
  if (!db) return [];

  return db.paymentProof.findMany({
    where: { status: "pending" },
    include: {
      user: { include: { profile: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPendingWithdrawals() {
  if (!db) return [];

  return db.withdrawalRequest.findMany({
    where: { status: { in: ["requested", "under_review"] } },
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAuditLogs(options?: { limit?: number; offset?: number }) {
  if (!db) return [];

  return db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}
