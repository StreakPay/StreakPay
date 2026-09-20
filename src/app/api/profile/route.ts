import { NextResponse } from "next/server";
import { updateProfileSchema } from "@/validators/auth";
import { getCurrentUser, getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getZodErrorMessage } from "@/lib/errors";

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    const streak = await db.streak.findUnique({
      where: { userId: session.user.id },
    });

    const wallet = await db.wallet.findUnique({
      where: { userId_currency: { userId: session.user.id, currency: "NGN" } },
    });

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        createdAt: session.user.createdAt,
      },
      profile: profile || null,
      streak: streak ? { currentStreak: streak.currentStreak, longestStreak: streak.longestStreak } : null,
      wallet: wallet ? { balance: Number(wallet.balance), currency: wallet.currency } : null,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(parsed.error) },
        { status: 400 }
      );
    }

    const updatedProfile = await db.userProfile.update({
      where: { userId: user.id },
      data: parsed.data,
    });

    return NextResponse.json({
      success: true,
      profile: {
        fullName: updatedProfile.fullName,
        tiktokUsername: updatedProfile.tiktokUsername,
        snapchatUsername: updatedProfile.snapchatUsername,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
