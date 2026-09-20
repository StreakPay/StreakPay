import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_COOKIE_NAME = "streakpay_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return uuidv4();
}

export async function createSession(userId: string) {
  if (!db) throw new Error("Database not available");

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });

  return { token, expiresAt };
}

export async function getSession() {
  if (!db) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  return session;
}

export async function destroySession() {
  if (!db) return;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db.session.deleteMany({ where: { token } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    fullName: session.user.profile?.fullName || "",
    profileImage: session.user.profile?.profileImage || null,
    verificationStatus: (session.user.profile?.verificationStatus || "unverified") as any,
    createdAt: session.user.createdAt,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
