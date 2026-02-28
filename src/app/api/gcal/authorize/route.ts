import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildGoogleAuthUrl } from "@/lib/gcal";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/gcal/authorize
 * Redirects the authenticated admin to Google OAuth consent page.
 * Reads GCal credentials from Organization DB or env vars.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if GCal is configured: DB first, then env
  const orgId = session.user.organizationId;
  let hasConfig = false;

  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { gcalClientId: true, gcalClientSecret: true },
    });
    hasConfig = !!(org?.gcalClientId && org?.gcalClientSecret);
  }

  if (!hasConfig) {
    // Fallback: check env vars
    hasConfig = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }

  if (!hasConfig) {
    return NextResponse.json(
      { error: "Google Calendar not configured. Silakan isi Client ID dan Client Secret di Settings terlebih dahulu." },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/gcal/callback`;
  const state = session.user.id; // Pass user ID as state for callback

  const authUrl = await buildGoogleAuthUrl(redirectUri, state, orgId);
  return NextResponse.redirect(authUrl);
}
