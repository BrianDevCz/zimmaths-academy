import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require a logged-in account
const protectedRoutes = [
  "/practice",
  "/daily",
  "/ai-tutor",
  "/dashboard",
  "/profile",
  "/upgrade",
  "/leaderboard",
  "/papers",
  "/topics",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("zim_token")?.value;

  const needsAuth = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (needsAuth && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/practice/:path*",
    "/daily/:path*",
    "/ai-tutor/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/upgrade/:path*",
    "/leaderboard/:path*",
    "/papers/:path*",
    "/topics/:path*",
  ],
};
