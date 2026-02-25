/**
 * ============================================================
 * NexCal — Google Calendar Service (1-Way Push)
 * ============================================================
 * Pushes confirmed bookings as events to the admin's Google Calendar.
 * Uses Google Calendar REST API v3 directly (zero npm dependencies).
 * Fire-and-forget: never crashes the booking flow.
 * ============================================================
 */

import { prisma } from "@/lib/prisma";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

// ============================================================
// Token Refresh
// ============================================================

interface GoogleTokens {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
}

/**
 * Get a valid access token for the user.
 * If the token is expired, refresh it using the refresh token.
 */
async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!user?.googleAccessToken || !user?.googleRefreshToken) return null;

  // Check if token is still valid (with 5-minute buffer)
  const now = new Date();
  const expiry = user.googleTokenExpiry
    ? new Date(user.googleTokenExpiry)
    : new Date(0);
  const bufferMs = 5 * 60 * 1000;

  if (expiry.getTime() - bufferMs > now.getTime()) {
    return user.googleAccessToken;
  }

  // Token expired — refresh it
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: user.googleRefreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.warn(`[GCal] Token refresh failed: ${response.status}`);
      return null;
    }

    const tokens: GoogleTokens = await response.json();

    // Save new tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token,
        googleTokenExpiry: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        ...(tokens.refresh_token
          ? { googleRefreshToken: tokens.refresh_token }
          : {}),
      },
    });

    return tokens.access_token;
  } catch (err) {
    console.warn(
      `[GCal] Token refresh error:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

// ============================================================
// Insert Event to Google Calendar
// ============================================================

interface BookingEventInfo {
  userId: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  notes?: string | null;
  clinicName?: string | null;
}

/**
 * Push a booking as an event to Google Calendar.
 * Fire-and-forget: only logs errors, never throws.
 */
async function insertEventToCalendar(
  accessToken: string,
  info: BookingEventInfo
): Promise<void> {
  const event = {
    summary: `📅 ${info.patientName} — ${info.serviceName}`,
    description: [
      `Pelanggan: ${info.patientName}`,
      `Telepon: ${info.patientPhone}`,
      `Layanan: ${info.serviceName}`,
      info.notes ? `Catatan: ${info.notes}` : null,
      ``,
      `Dibuat oleh ${info.clinicName || "NexCal"}`,
    ]
      .filter(Boolean)
      .join("\n"),
    start: {
      dateTime: info.startTime.toISOString(),
      timeZone: "Asia/Jakarta",
    },
    end: {
      dateTime: info.endTime.toISOString(),
      timeZone: "Asia/Jakarta",
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 30 }],
    },
  };

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    console.warn(`[GCal] Insert event failed: ${response.status} — ${body}`);
  }
}

// ============================================================
// Public API — Fire-and-Forget
// ============================================================

/**
 * Push confirmed booking to Google Calendar.
 * Safe to call anywhere — catches all errors internally.
 */
export function pushBookingToCalendar(info: BookingEventInfo): void {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return;

  (async () => {
    try {
      const accessToken = await getValidAccessToken(info.userId);
      if (!accessToken) return; // User hasn't connected Google Calendar

      await insertEventToCalendar(accessToken, info);
    } catch (err) {
      console.warn(
        `[GCal] Push failed (non-blocking):`,
        err instanceof Error ? err.message : err
      );
    }
  })();
}

// ============================================================
// OAuth Helpers — used by API routes
// ============================================================

const SCOPES = "https://www.googleapis.com/auth/calendar.events";

/** Build the Google OAuth 2.0 authorization URL */
export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** Exchange authorization code for tokens */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokens | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;
    return (await response.json()) as GoogleTokens;
  } catch {
    return null;
  }
}

/** Check if Google Calendar is configured (env vars present) */
export function isGCalConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}
