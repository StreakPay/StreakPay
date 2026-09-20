import { NextResponse } from "next/server";
import { newPasswordSchema } from "@/validators/auth";
import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { getZodErrorMessage } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = newPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(parsed.error) },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetExpires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Set new password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
