import { NextRequest, NextResponse } from "next/server";

// Redirect unauthenticated users to login and authenticated users to feed
const AUTH_PAGES = ["/login", "/register"];
// Always accessible regardless of auth state
const OPEN_PAGES = ["/forgot-password", "/reset-password", "/verify-email"];

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isOpenPage = OPEN_PAGES.some((p) => pathname.startsWith(p));

  if (!token && !isAuthPage && !isOpenPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.ico$|public).*)"],
};
