import { NextResponse } from "next/server";
import { registerSchema } from "@/validators/auth";
import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
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
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(parsed.error) },
        { status: 400 }
      );
    }

    const { fullName, email, password } = parsed.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        id: uuidv4(),
        email,
        passwordHash,
        profile: {
          create: {
            id: uuidv4(),
            fullName,
            verificationStatus: "unverified",
          },
        },
        streak: {
          create: {
            id: uuidv4(),
            currentStreak: 0,
            longestStreak: 0,
          },
        },
        wallets: {
          create: [
            {
              id: uuidv4(),
              currency: "NGN",
              balance: 0,
            },
            {
              id: uuidv4(),
              currency: "USD",
              balance: 0,
            },
          ],
        },
        tradingAccount: {
          create: {
            id: uuidv4(),
            cashBalance: 10000,
            totalPnL: 0,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const { createSession } = await import("@/lib/auth");
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
