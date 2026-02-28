/**
 * ============================================================
 * NexCal — Google Calendar Service (1-Way Push)
 * ============================================================
 * Pushes confirmed bookings as events to the admin's Google Calendar.
 * Config priority: Organization DB settings → env vars fallback.
 * Fire-and-forget: never crashes the booking flow.
 * ============================================================
 */

import { prisma } from "@/lib/prisma";

// ============================================================
// Config — DB first, env fallback
// ============================================================

const ENV_GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const ENV_GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

interface GCalConfig {
  clientId: string;
  clientSecret: string;
}

/**
 * Get Google Calendar config for a given organization.
 * Priority: DB settings → env fallback.
 */
async function getGCalConfig(organizationId?: string | null): Promise<GCalConfig> {
  if (organizationId) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { gcalClientId: true, gcalClientSecret: true },
      });
      if (org?.gcalClientId && org?.gcalClientSecret) {
        return { clientId: org.gcalClientId, clientSecret: org.gcalClientSecret };
      }
    } catch {
      // Fall through to env
    }
  }
  return { clientId: ENV_GOOGLE_CLIENT_ID, clientSecret: ENV_GOOGLE_CLIENT_SECRET };
}

// ============================================================
// Token Refresh
// ============================================================

interface GoogleTokens {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
}

async function getValidAccessToken(userId: string, config: GCalConfig): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!user?.googleAccessToken || !user?.googleRefreshToken) return null;

  const now = new Date();
  const expiry = user.googleTokenExpiry ? new Date(user.googleTokenExpiry) : new Date(0);
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
        client_id: config.clientId,
        client_secret: config.clientSecret,
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

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token,
        googleTokenExpiry: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
      },
    });

    return tokens.access_token;
  } catch (err) {
    console.warn(`[GCal] Token refresh error:`, err instanceof Error ? err.message : err);
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
  organizationId?: string | null;
  isVirtual?: boolean;
  bookingId?: string;
}

async function insertEventToCalendar(accessToken: string, info: BookingEventInfo): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event: Record<string, any> = {
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
    start: { dateTime: info.startTime.toISOString(), timeZone: "Asia/Jakarta" },
    end: { dateTime: info.endTime.toISOString(), timeZone: "Asia/Jakarta" },
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
  };

  // Inject Google Meet conference data for virtual services
  if (info.isVirtual) {
    event.conferenceData = {
      createRequest: {
        requestId: `nexcal-${info.bookingId || Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const url = info.isVirtual
    ? "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1"
    : "https://www.googleapis.com/calendar/v3/calendars/primary/events";

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text();
    console.warn(`[GCal] Insert event failed: ${response.status} — ${body}`);
    return null;
  }

  // Parse response to get Google Meet link
  if (info.isVirtual) {
    try {
      const data = await response.json();
      const meetUrl = data.hangoutLink || null;
      if (meetUrl) {
        console.log(`[GCal] Google Meet link created: ${meetUrl}`);
      }
      return meetUrl;
    } catch {
      return null;
    }
  }

  return null;
}

// ============================================================
// Public API — Push to Calendar with optional Meet URL return
// ============================================================

export async function pushBookingToCalendar(info: BookingEventInfo): Promise<string | null> {
  const config = await getGCalConfig(info.organizationId);
  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      "Konfigurasi Google Calendar belum diatur untuk organisasi ini. Buka Pengaturan → Google Calendar untuk mengisinya."
    );
  }

  const accessToken = await getValidAccessToken(info.userId, config);
  if (!accessToken) {
    throw new Error(
      "Staf ini belum menghubungkan Google Calendar-nya. Minta staf untuk membuka Pengaturan → Google Calendar → Hubungkan."
    );
  }

  const meetUrl = await insertEventToCalendar(accessToken, info);

  // Save meetingUrl to booking if available
  if (meetUrl && info.bookingId) {
    await prisma.booking.update({
      where: { id: info.bookingId },
      data: { meetingUrl: meetUrl },
    });
    console.log(`[GCal] Meet URL saved to booking ${info.bookingId}: ${meetUrl}`);
  }

  return meetUrl;
}

// ============================================================
// OAuth Helpers — used by API routes
// ============================================================

const SCOPES = "https://www.googleapis.com/auth/calendar.events";

/**
 * Build the Google OAuth 2.0 authorization URL.
 * Uses org config from DB if available, otherwise env.
 */
export async function buildGoogleAuthUrl(redirectUri: string, state: string, organizationId?: string | null): Promise<string> {
  const config = await getGCalConfig(organizationId);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens.
 * Uses org config from DB if available, otherwise env.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  organizationId?: string | null
): Promise<GoogleTokens | null> {
  try {
    const config = await getGCalConfig(organizationId);
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
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

/**
 * Check if Google Calendar is configured (DB or env vars present).
 */
export function isGCalConfigured(): boolean {
  return !!(ENV_GOOGLE_CLIENT_ID && ENV_GOOGLE_CLIENT_SECRET);
}
