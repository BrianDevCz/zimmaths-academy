import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("zim_token")?.value;

  // Allow /papers and /topics listing pages (no trailing slash match)
  // Block /papers/[id] and /topics/[slug] (has content after the slash)
  const needsAuth =
    pathname.startsWith("/practice") ||
    pathname.startsWith("/daily") ||
    pathname.startsWith("/ai-tutor") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/upgrade") ||
    pathname.startsWith("/bookmarks") ||
    pathname.startsWith("/badges") ||
    pathname.startsWith("/admin") ||
    (pathname.startsWith("/papers/") && pathname.length > "/papers/".length) ||
    (pathname.startsWith("/topics/") && pathname.length > "/topics/".length);

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
    "/bookmarks/:path*",
    "/badges/:path*",
    "/admin/:path*",
    "/papers/:path*",
    "/topics/:path*",
  ],
};
