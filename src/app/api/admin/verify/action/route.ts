import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewVerification } from "@/services/admin/verification";

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
    const { userId, approved, notes } = body;

    if (!userId || typeof approved !== "boolean") {
      return NextResponse.json({ error: "userId and approved (boolean) are required" }, { status: 400 });
    }

    const result = await reviewVerification(userId, session.user.id, approved, notes);
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
