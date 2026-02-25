import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildGoogleAuthUrl, isGCalConfigured } from "@/lib/gcal";

/**
 * GET /api/gcal/authorize
 * Redirects the authenticated admin to Google OAuth consent page.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGCalConfigured()) {
    return NextResponse.json(
      { error: "Google Calendar not configured" },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/gcal/callback`;
  const state = session.user.id; // Pass user ID as state for callback

  const authUrl = buildGoogleAuthUrl(redirectUri, state);
  return NextResponse.redirect(authUrl);
}
