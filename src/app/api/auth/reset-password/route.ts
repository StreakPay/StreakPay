import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/validators/auth";
import { generateToken } from "@/lib/auth";
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
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(parsed.error) },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, a reset link has been sent.",
      });
    }

    const resetToken = generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires,
      },
    });

    // In production: send email with reset link
    // For now, return success message
    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a reset link has been sent.",
      // Development only: include token
      ...(process.env.NODE_ENV === "development" && { resetToken }),
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
