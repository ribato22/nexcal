/**
 * ============================================================
 * NexCal — WhatsApp Notification via MultiWA
 * ============================================================
 * Non-blocking WhatsApp messaging via the MultiWA API Gateway.
 * All functions are fire-and-forget: they will NEVER throw or
 * block the main booking flow, even if MultiWA is unreachable.
 * ============================================================
 */

import { format } from "date-fns";
import { id } from "date-fns/locale";

// ============================================================
// Config — reads from environment variables
// ============================================================

const MULTIWA_API_URL = process.env.MULTIWA_API_URL || "";
const MULTIWA_API_KEY = process.env.MULTIWA_API_KEY || "";
const MULTIWA_SESSION_ID = process.env.MULTIWA_SESSION_ID || "";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "NexCal";

/** Check if WhatsApp notifications are configured */
function isConfigured(): boolean {
  return !!(MULTIWA_API_URL && MULTIWA_API_KEY && MULTIWA_SESSION_ID);
}

// ============================================================
// Core: sendWhatsApp — fire-and-forget HTTP POST
// ============================================================

/**
 * Send a WhatsApp message via MultiWA API.
 * This function is intentionally non-blocking and will never throw.
 * If MultiWA is down or misconfigured, the error is logged silently.
 */
async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (!isConfigured()) return;

  try {
    const normalizedPhone = normalizePhone(phone);
    const url = `${MULTIWA_API_URL}/api/sessions/${MULTIWA_SESSION_ID}/messages/send`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": MULTIWA_API_KEY,
      },
      body: JSON.stringify({
        to: normalizedPhone,
        text: message,
      }),
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    if (!response.ok) {
      console.warn(
        `[WhatsApp] Failed to send message to ${normalizedPhone}: ${response.status} ${response.statusText}`
      );
    }
  } catch (err) {
    // Silently log — never crash the booking flow
    console.warn(`[WhatsApp] Send failed (non-blocking):`, err instanceof Error ? err.message : err);
  }
}

// ============================================================
// Phone number normalization (Indonesian format)
// ============================================================

/** Normalize phone: strip spaces/dashes, convert 08xx → 628xx */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-+]/g, "");
  if (cleaned.startsWith("08")) {
    cleaned = "62" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

// ============================================================
// Message Templates
// ============================================================

interface BookingInfo {
  patientName: string;
  patientPhone: string;
  serviceName: string;
  date: Date;
  startTime: string; // "HH:mm"
  duration: number;
  clinicName?: string;
}

/** Format date to Indonesian locale, e.g. "Senin, 3 Maret 2026" */
function formatDate(date: Date): string {
  return format(date, "EEEE, d MMMM yyyy", { locale: id });
}

// ── Template 1: Booking Received (PENDING) ──────────────────

function buildBookingReceivedMessage(info: BookingInfo): string {
  const clinic = info.clinicName || APP_NAME;
  return [
    `✅ *Booking Diterima*`,
    ``,
    `Halo *${info.patientName}*,`,
    `Booking Anda telah kami terima dan sedang menunggu konfirmasi.`,
    ``,
    `📋 *Detail Booking:*`,
    `• Layanan: ${info.serviceName}`,
    `• Tanggal: ${formatDate(info.date)}`,
    `• Jam: ${info.startTime} (${info.duration} menit)`,
    ``,
    `Kami akan mengirim notifikasi setelah booking dikonfirmasi.`,
    ``,
    `Terima kasih! 🙏`,
    `— ${clinic}`,
  ].join("\n");
}

// ── Template 2: Booking Confirmed ───────────────────────────

function buildBookingConfirmedMessage(info: BookingInfo): string {
  const clinic = info.clinicName || APP_NAME;
  return [
    `🎉 *Booking Dikonfirmasi!*`,
    ``,
    `Halo *${info.patientName}*,`,
    `Booking Anda telah *dikonfirmasi*. Silakan datang sesuai jadwal berikut:`,
    ``,
    `📋 *Detail Booking:*`,
    `• Layanan: ${info.serviceName}`,
    `• Tanggal: ${formatDate(info.date)}`,
    `• Jam: ${info.startTime} (${info.duration} menit)`,
    ``,
    `Mohon datang 10 menit sebelum jadwal. Jika ingin membatalkan, hubungi kami secepatnya.`,
    ``,
    `Sampai jumpa! 👋`,
    `— ${clinic}`,
  ].join("\n");
}

// ── Template 3: Booking Cancelled ───────────────────────────

function buildBookingCancelledMessage(
  info: BookingInfo,
  reason?: string | null
): string {
  const clinic = info.clinicName || APP_NAME;
  const lines = [
    `❌ *Booking Dibatalkan*`,
    ``,
    `Halo *${info.patientName}*,`,
    `Maaf, booking Anda telah dibatalkan.`,
    ``,
    `📋 *Detail Booking:*`,
    `• Layanan: ${info.serviceName}`,
    `• Tanggal: ${formatDate(info.date)}`,
    `• Jam: ${info.startTime}`,
  ];

  if (reason) {
    lines.push(``, `📝 *Alasan:* ${reason}`);
  }

  lines.push(
    ``,
    `Silakan lakukan booking ulang untuk jadwal lain.`,
    ``,
    `Mohon maaf atas ketidaknyamanannya. 🙏`,
    `— ${clinic}`
  );

  return lines.join("\n");
}

// ============================================================
// Public API — Fire-and-Forget Notification Senders
// ============================================================

/** Send "Booking Received" notification (called after customer books) */
export function notifyBookingReceived(info: BookingInfo): void {
  const message = buildBookingReceivedMessage(info);
  // Fire and forget — don't await
  sendWhatsApp(info.patientPhone, message).catch(() => {});
}

/** Send "Booking Confirmed" notification (called by admin) */
export function notifyBookingConfirmed(info: BookingInfo): void {
  const message = buildBookingConfirmedMessage(info);
  sendWhatsApp(info.patientPhone, message).catch(() => {});
}

/** Send "Booking Cancelled" notification (called by admin) */
export function notifyBookingCancelled(
  info: BookingInfo,
  reason?: string | null
): void {
  const message = buildBookingCancelledMessage(info, reason);
  sendWhatsApp(info.patientPhone, message).catch(() => {});
}
