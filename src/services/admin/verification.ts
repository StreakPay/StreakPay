import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function reviewVerification(
  userId: string,
  reviewerId: string,
  approved: boolean,
  notes?: string
) {
  if (!db) throw new Error("Database not available");

  return db.$transaction(async (tx: any) => {
    const profile = await tx.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) throw new Error("User profile not found");

    const newStatus = approved ? "verified" : "rejected";

    await tx.userProfile.update({
      where: { userId },
      data: { verificationStatus: newStatus },
    });

    await tx.paymentProof.updateMany({
      where: { userId, status: "pending" },
      data: {
        status: approved ? "approved" : "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        notes,
      },
    });

    await tx.notification.create({
      data: {
        id: uuidv4(),
        userId,
        type: approved ? "verification_approved" : "verification_rejected",
        title: approved ? "Verification Approved" : "Verification Rejected",
        message: approved
          ? "Your account has been verified. You now have full access to StreakPay."
          : `Your verification was rejected. ${notes || "Please contact support."}`,
      },
    });

    await tx.auditLog.create({
      data: {
        id: uuidv4(),
        actorId: reviewerId,
        actorEmail: "admin",
        action: approved ? "ADMIN_APPROVED_VERIFICATION" : "ADMIN_REJECTED_VERIFICATION",
        targetId: userId,
        targetType: "user",
        previousState: { verificationStatus: profile.verificationStatus },
        newState: { verificationStatus: newStatus },
      },
    });

    return { userId, status: newStatus };
  });
}

export async function suspendUser(
  userId: string,
  adminId: string,
  reason: string
) {
  if (!db) throw new Error("Database not available");

  return db.$transaction(async (tx: any) => {
    const profile = await tx.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error("User not found");

    await tx.userProfile.update({
      where: { userId },
      data: { verificationStatus: "suspended" },
    });

    await tx.notification.create({
      data: {
        id: uuidv4(),
        userId,
        type: "security_alert",
        title: "Account Suspended",
        message: `Your account has been suspended. Reason: ${reason}`,
      },
    });

    await tx.auditLog.create({
      data: {
        id: uuidv4(),
        actorId: adminId,
        actorEmail: "admin",
        action: "ADMIN_SUSPENDED_USER",
        targetId: userId,
        targetType: "user",
        previousState: { verificationStatus: profile.verificationStatus },
        newState: { verificationStatus: "suspended", reason },
      },
    });

    return { userId, status: "suspended" };
  });
}
