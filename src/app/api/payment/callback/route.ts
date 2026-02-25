import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyBookingConfirmed } from "@/lib/whatsapp";
import { format } from "date-fns";

/**
 * NexCal — Payment Webhook / Callback Handler
 *
 * Menerima notifikasi HTTP POST dari payment gateway (Midtrans, dll).
 * Memvalidasi status transaksi dan mengupdate paymentStatus di booking.
 *
 * Midtrans notification format:
 * {
 *   "order_id": "NEXCAL-clxxx...",
 *   "status_code": "200",
 *   "transaction_status": "settlement" | "capture" | "pending" | "deny" | "expire" | "cancel",
 *   "gross_amount": "75000.00",
 *   "signature_key": "...",
 *   "payment_type": "bank_transfer",
 *   ...
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = body.order_id as string;
    const transactionStatus = body.transaction_status as string;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order_id" },
        { status: 400 }
      );
    }

    // Extract booking ID from order_id (format: "NEXCAL-{bookingId}")
    const bookingId = orderId.replace(/^NEXCAL-/, "");

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        paymentStatus: true,
        paymentGateway: true,
        patientName: true,
        patientPhone: true,
        date: true,
        startTime: true,
        endTime: true,
        totalPrice: true,
        serviceType: { select: { name: true, duration: true } },
        user: { select: { clinicName: true } },
      },
    });

    if (!booking) {
      console.warn(`[Webhook] Booking not found: ${bookingId}`);
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Skip if already paid (idempotent)
    if (booking.paymentStatus === "PAID") {
      return NextResponse.json({ status: "already_paid" });
    }

    // Map gateway status → our PaymentStatus
    let newPaymentStatus: "PAID" | "FAILED" | "UNPAID";

    switch (transactionStatus) {
      case "capture":
      case "settlement":
        newPaymentStatus = "PAID";
        break;
      case "deny":
      case "cancel":
      case "expire":
        newPaymentStatus = "FAILED";
        break;
      case "pending":
      default:
        newPaymentStatus = "UNPAID";
        break;
    }

    // Update booking payment status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: newPaymentStatus },
    });

    console.log(
      `[Webhook] Booking ${bookingId}: ${booking.paymentStatus} → ${newPaymentStatus} (gateway: ${transactionStatus})`
    );

    // If payment confirmed → also confirm booking + send WhatsApp
    if (newPaymentStatus === "PAID") {
      // Auto-confirm booking when payment is received
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
      });

      // Fire-and-forget WhatsApp notification
      Promise.resolve(
        notifyBookingConfirmed({
          patientName: booking.patientName,
          patientPhone: booking.patientPhone,
          serviceName: booking.serviceType.name,
          date: booking.date,
          startTime: format(new Date(booking.startTime), "HH:mm"),
          duration: booking.serviceType.duration,
          clinicName: booking.user?.clinicName || undefined,
        })
      ).catch(() => {});

      console.log(`[Webhook] Booking ${bookingId} auto-confirmed after payment ✅`);
    }

    return NextResponse.json({ status: "ok", paymentStatus: newPaymentStatus });
  } catch (error) {
    console.error("[Webhook] Error processing payment callback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also accept GET for health check
export async function GET() {
  return NextResponse.json({
    service: "NexCal Payment Webhook",
    status: "active",
    endpoint: "POST /api/payment/callback",
  });
}
