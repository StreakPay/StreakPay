import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAdminStats } from "@/services/admin";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const admin = await db.adminUser.findUnique({
      where: { userId: session.user.id },
    });

    if (!admin) return NextResponse.json({ error: "Not an admin" }, { status: 403 });

    const stats = await getAdminStats();
    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
