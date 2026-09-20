import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

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
  "/verify",
  "/support",
];

const authRoutes = ["/login", "/register", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const supabaseResponse = await updateSession(request);

  // If the user is not logged in and trying to access a protected route, redirect to login
  if (isProtectedRoute) {
    // The session check happens in updateSession — if no valid session,
    // Supabase auth.getUser() will fail and the cookie won't be refreshed.
    // We need to check if a session exists by looking for the supabase auth cookie.
    const hasSession = request.cookies.get("sb-access-token")?.value ||
                       request.cookies.get("sb:token")?.value;

    // Also check for the standard Supabase auth cookie pattern
    const allCookies = request.cookies.getAll();
    const hasSupabaseCookie = allCookies.some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );

    if (!hasSession && !hasSupabaseCookie) {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", pathname);
      return Response.redirect(url);
    }
  }

  // If the user is logged in and trying to access auth routes, redirect to home
  if (isAuthRoute) {
    const allCookies = request.cookies.getAll();
    const hasSupabaseCookie = allCookies.some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );

    if (hasSupabaseCookie) {
      return Response.redirect(new URL("/home", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
