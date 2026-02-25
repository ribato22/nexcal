import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware ringan untuk proteksi route /admin/*.
 * Hanya memeriksa keberadaan session token cookie.
 * Verifikasi session yang sesungguhnya dilakukan di admin layout (server-side).
 *
 * Pendekatan ini menghindari import NextAuth di Edge Runtime
 * yang menyebabkan error "crypto module not supported".
 */
export function middleware(request: NextRequest) {
  const sessionToken =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token");

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
