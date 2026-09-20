import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (!db) throw new Error("Database not available");

  const admin = await db.adminUser.findUnique({
    where: { userId: session.user.id },
  });

  if (!admin || !admin.active) throw new Error("Not an admin");

  return { session, admin };
}

export async function GET() {
  try {
    const { session, admin } = await requireAdmin();

    const users = await db.user.findMany({
      include: { profile: true, streak: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ users, adminRole: admin.role });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
