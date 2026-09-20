import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function requestWithdrawal(
  userId: string,
  amount: number,
  bankName: string,
  accountNumber: string,
  accountName: string
) {
  if (!db) throw new Error("Database not available");

  const wallet = await db.wallet.findUnique({
    where: { userId_currency: { userId, currency: "NGN" } },
  });

  if (!wallet) throw new Error("Wallet not found");
  if (Number(wallet.balance) < amount) throw new Error("Insufficient balance");
  if (amount < 500) throw new Error("Minimum withdrawal is ₦500");

  const pendingWithdrawals = await db.withdrawalRequest.count({
    where: {
      userId,
      status: { in: ["requested", "under_review", "approved", "processing"] },
    },
  });

  if (pendingWithdrawals > 0) {
    throw new Error("You have a pending withdrawal request");
  }

  const reference = `WD-${Date.now()}-${uuidv4().slice(0, 6)}`;

  return db.$transaction(async (tx: any) => {
    const newBalance = Number(wallet.balance) - amount;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    await tx.ledgerEntry.create({
      data: {
        id: uuidv4(),
        userId,
        amount,
        currency: "NGN",
        direction: "debit",
        type: "withdrawal_debit",
        reference,
        source: "withdrawal_request",
        status: "pending",
      },
    });

    const withdrawal = await tx.withdrawalRequest.create({
      data: {
        id: uuidv4(),
        userId,
        amount,
        currency: "NGN",
        bankName,
        accountNumber,
        accountName,
        reference,
        status: "requested",
      },
    });

    return withdrawal;
  });
}

export async function getWithdrawalHistory(userId: string, limit: number = 20) {
  if (!db) return [];

  return db.withdrawalRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function approveWithdrawal(
  withdrawalId: string,
  reviewerId: string
) {
  if (!db) throw new Error("Database not available");

  return db.$transaction(async (tx: any) => {
    const withdrawal = await tx.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) throw new Error("Withdrawal not found");
    if (withdrawal.status !== "requested" && withdrawal.status !== "under_review") {
      throw new Error("Withdrawal cannot be approved");
    }

    const updated = await tx.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: "approved",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        id: uuidv4(),
        actorId: reviewerId,
        actorEmail: "admin",
        action: "ADMIN_APPROVED_WITHDRAWAL",
        targetId: withdrawalId,
        targetType: "withdrawal",
        previousState: { status: withdrawal.status },
        newState: { status: "approved" },
      },
    });

    return updated;
  });
}

export async function rejectWithdrawal(
  withdrawalId: string,
  reviewerId: string,
  reason?: string
) {
  if (!db) throw new Error("Database not available");

  return db.$transaction(async (tx: any) => {
    const withdrawal = await tx.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) throw new Error("Withdrawal not found");

    const wallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId: withdrawal.userId, currency: "NGN" } },
    });

    if (wallet) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: Number(wallet.balance) + Number(withdrawal.amount) },
      });

      await tx.ledgerEntry.create({
        data: {
          id: uuidv4(),
          userId: withdrawal.userId,
          amount: Number(withdrawal.amount),
          currency: "NGN",
          direction: "credit",
          type: "reversal",
          reference: `REV-${withdrawal.reference}`,
          source: "withdrawal_rejection",
          status: "completed",
        },
      });
    }

    const updated = await tx.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        metadata: { reason },
      },
    });

    await tx.auditLog.create({
      data: {
        id: uuidv4(),
        actorId: reviewerId,
        actorEmail: "admin",
        action: "ADMIN_REJECTED_WITHDRAWAL",
        targetId: withdrawalId,
        targetType: "withdrawal",
        previousState: { status: withdrawal.status },
        newState: { status: "rejected", reason },
      },
    });

    return updated;
  });
}
