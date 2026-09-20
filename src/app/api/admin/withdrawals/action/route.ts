import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { approveWithdrawal, rejectWithdrawal } from "@/services/admin/withdrawals";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!db) throw new Error("Database not available");
  const admin = await db.adminUser.findUnique({ where: { userId: session.user.id } });
  if (!admin || !admin.active) throw new Error("Not an admin");
  return { session };
}

export async function POST(request: Request) {
  try {
    const { session } = await requireAdmin();
    const body = await request.json();
    const { withdrawalId, action, reason } = body;

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: "withdrawalId and action are required" }, { status: 400 });
    }

    let result;
    if (action === "approve") {
      result = await approveWithdrawal(withdrawalId, session.user.id);
    } else if (action === "reject") {
      result = await rejectWithdrawal(withdrawalId, session.user.id, reason);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, withdrawal: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
