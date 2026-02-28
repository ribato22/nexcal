import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/gcal";

/**
 * GET /api/gcal/callback
 * Handles the OAuth 2.0 callback from Google, stores tokens, and redirects.
 * Reads GCal credentials from the user's Organization DB or env vars.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId
  const error = searchParams.get("error");

  // User denied access
  if (error) {
    return NextResponse.redirect(
      new URL("/admin/settings?gcal=denied", request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/admin/settings?gcal=error", request.url)
    );
  }

  // Fetch user's organizationId so we can get the right GCal config
  const user = await prisma.user.findUnique({
    where: { id: state },
    select: { organizationId: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/gcal/callback`;

  // Exchange code for tokens using org-specific or env credentials
  const tokens = await exchangeCodeForTokens(code, redirectUri, user?.organizationId);

  if (!tokens) {
    return NextResponse.redirect(
      new URL("/admin/settings?gcal=error", request.url)
    );
  }

  // Save tokens to database
  await prisma.user.update({
    where: { id: state },
    data: {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token || null,
      googleTokenExpiry: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
    },
  });

  return NextResponse.redirect(
    new URL("/admin/settings?gcal=connected", request.url)
  );
}
