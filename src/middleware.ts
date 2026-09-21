import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = [
  "/home",
  "/streak",
  "/chat",
  "/trade",
  "/profile",
  "/rewards",
  "/withdrawals",
  "/notifications",
  "/settings",
  "/admin",
  "/verify",
  "/support",
];

const authRoutes = ["/login", "/register", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const supabaseResponse = await updateSession(request);

  // Check session by looking at the request cookies (browser-sent)
  // updateSession already called getUser() which validated the session
  const hasSessionCookie = request.cookies.getAll().some(
    (c) => c.name.includes("auth-token")
  );

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !hasSessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return Response.redirect(url);
  }

  if (isAuthRoute && hasSessionCookie) {
    return Response.redirect(new URL("/home", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
