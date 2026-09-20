import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/home",
  "/streak",
  "/music",
  "/trade",
  "/profile",
  "/rewards",
  "/withdrawals",
  "/notifications",
  "/settings",
  "/admin",
];

const authRoutes = ["/login", "/register", "/reset-password"];

const apiRoutes = ["/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("streakpay_session")?.value;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isApiRoute = apiRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !sessionToken) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (isApiRoute && !sessionToken && pathname !== "/api/auth/login" && pathname !== "/api/auth/register") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
