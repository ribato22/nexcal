"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getAvailableSlots, ScheduleSession, DateOverrideData, ExistingBooking } from "@/lib/slots";
import { parse, startOfDay, addMinutes, format } from "date-fns";
import { notifyBookingReceived } from "@/lib/whatsapp";
import { getPaymentProvider, isPaymentEnabled, calculatePaymentAmount } from "@/lib/payment/core";


// ============================================================
// Schema Validasi (Lapis 1: Zod)
// ============================================================

const bookingSchema = z.object({
  serviceTypeId: z.string().min(1, "Pilih jenis layanan."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Waktu tidak valid."),
  patientName: z
    .string()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama terlalu panjang."),
  patientPhone: z
    .string()
    .min(10, "Nomor WhatsApp minimal 10 digit.")
    .max(20, "Nomor WhatsApp terlalu panjang.")
    .regex(/^[0-9+\-\s]+$/, "Format nomor tidak valid."),
  patientNotes: z.string().max(500, "Catatan terlalu panjang.").optional(),
});

// ============================================================
// Server Action: createBooking
// Anti Double-Booking 3 Lapis:
// 1. Validasi Zod
// 2. Re-check slot availability
// 3. DB unique constraint catch (P2002)
// ============================================================

export interface BookingResult {
  success: boolean;
  error: string | null;
  bookingId: string | null;
  summary: {
    serviceName: string;
    date: string;
    time: string;
    patientName: string;
    paymentUrl?: string; // URL redirect ke gateway pembayaran
    totalPrice?: number;
    manageUrl?: string;  // URL portal pasien (self-service)
  } | null;
}

export async function createBookingAction(
  _prevState: BookingResult,
  formData: FormData
): Promise<BookingResult> {
  const empty: BookingResult = { success: false, error: null, bookingId: null, summary: null };

  try {
    // ============================================
    // LAPIS 1: Validasi Zod
    // ============================================
    const raw = {
      serviceTypeId: formData.get("serviceTypeId") as string,
      date: formData.get("date") as string,
      startTime: formData.get("startTime") as string,
      patientName: formData.get("patientName") as string,
      patientPhone: formData.get("patientPhone") as string,
      patientNotes: (formData.get("patientNotes") as string) || undefined,
    };

    const parsed = bookingSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Data tidak valid.";
      return { ...empty, error: firstError };
    }

    const { serviceTypeId, date, startTime, patientName, patientPhone, patientNotes } = parsed.data;

    // Ambil data layanan
    const service = await prisma.serviceType.findUnique({
      where: { id: serviceTypeId },
      select: { duration: true, bufferTime: true, userId: true, name: true, price: true, dpPercentage: true },
    });

    if (!service) {
      return { ...empty, error: "Layanan tidak ditemukan." };
    }

    // Ambil nama klinik/bisnis dan orgId dari pemilik
    const owner = await prisma.user.findUnique({
      where: { id: service.userId },
      select: { clinicName: true, organizationId: true },
    });

    // Hitung waktu mulai dan selesai
    const targetDate = new Date(date);
    const refDate = startOfDay(targetDate);
    const slotStart = parse(startTime, "HH:mm", refDate);
    const slotEnd = addMinutes(slotStart, service.duration);

    // ============================================
    // LAPIS 2: Re-check slot sebelum insert
    // ============================================
    const [schedules, overrides, bookings] = await Promise.all([
      prisma.schedule.findMany({
        where: { userId: service.userId, isActive: true },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      }),
      prisma.dateOverride.findMany({
        where: { userId: service.userId },
        select: { date: true, isBlocked: true, startTime: true, endTime: true },
      }),
      prisma.booking.findMany({
        where: {
          userId: service.userId,
          date: refDate,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: { startTime: true, endTime: true, serviceType: { select: { bufferTime: true } } },
      }),
    ]);

    const scheduleSessions: ScheduleSession[] = schedules.map((s: { dayOfWeek: number; startTime: string; endTime: string }) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    const dateOverrides: DateOverrideData[] = overrides.map((o: { date: Date; isBlocked: boolean; startTime: string | null; endTime: string | null }) => ({
      date: o.date,
      isBlocked: o.isBlocked,
      startTime: o.startTime,
      endTime: o.endTime,
    }));

    const existingBookings: ExistingBooking[] = bookings.map((b: { startTime: Date; endTime: Date; serviceType: { bufferTime: number } }) => ({
      startTime: b.startTime,
      endTime: b.endTime,
      bufferTime: b.serviceType.bufferTime,
    }));

    const availableSlots = getAvailableSlots(
      targetDate,
      scheduleSessions,
      dateOverrides,
      existingBookings,
      service.duration,
      service.bufferTime
    );

    const isSlotAvailable = availableSlots.some(
      (slot) => slot.startTime === startTime && slot.available
    );

    if (!isSlotAvailable) {
      return {
        ...empty,
        error: "Maaf, slot ini sudah tidak tersedia. Silakan pilih waktu lain.",
      };
    }

    // ============================================
    // LAPIS 3: Insert dengan DB constraint catch
    // ============================================
    try {
      // Hitung harga & DP
      const isPaid = service.price > 0;
      const paymentAmount = isPaid
        ? calculatePaymentAmount(service.price, service.dpPercentage)
        : 0;

      const booking = await prisma.booking.create({
        data: {
          userId: service.userId,
          serviceTypeId,
          date: refDate,
          startTime: slotStart,
          endTime: slotEnd,
          patientName,
          patientPhone,
          patientNotes: patientNotes || null,
          status: "PENDING",
          // Payment fields
          paymentStatus: isPaid ? "UNPAID" : "PAID", // Gratis = otomatis PAID
          totalPrice: service.price,
          dpAmount: paymentAmount,
        },
      });

      // Jika layanan berbayar dan gateway dikonfigurasi → buat transaksi
      let paymentUrl: string | undefined;
      if (isPaid && await isPaymentEnabled(owner?.organizationId)) {
        try {
          const provider = getPaymentProvider(owner?.organizationId);
          const txResult = await provider.createTransaction({
            bookingId: booking.id,
            amount: paymentAmount,
            customerName: patientName,
            customerPhone: patientPhone,
            serviceName: service.name,
            merchantName: owner?.clinicName || undefined,
          });

          if (txResult.success && txResult.paymentRefId) {
            // Update booking dengan data pembayaran
            await prisma.booking.update({
              where: { id: booking.id },
              data: {
                paymentGateway: provider.name,
                paymentRefId: txResult.paymentRefId,
                paymentUrl: txResult.paymentUrl || null,
              },
            });
            paymentUrl = txResult.paymentUrl;
          }
        } catch (paymentErr) {
          // Payment gateway error tidak membatalkan booking
          console.error("[Payment] Gateway error (booking tetap dibuat):", paymentErr);
        }
      }

      // Fire-and-forget WhatsApp notification
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const manageUrl = `${appUrl}/booking/manage/${booking.managementToken}`;

      notifyBookingReceived({
        patientName,
        patientPhone,
        serviceName: service.name,
        date: refDate,
        startTime: format(slotStart, "HH:mm"),
        duration: service.duration,
        clinicName: owner?.clinicName || undefined,
        manageUrl,
      });

      return {
        success: true,
        error: null,
        bookingId: booking.id,
        summary: {
          serviceName: service.name,
          date,
          time: startTime,
          patientName,
          paymentUrl,
          totalPrice: isPaid ? paymentAmount : undefined,
          manageUrl,
        },
      };
    } catch (dbError: unknown) {
      // Tangkap unique constraint violation (race condition)
      const isPrismaUniqueError =
        dbError instanceof Error &&
        "code" in dbError &&
        (dbError as { code: string }).code === "P2002";

      if (isPrismaUniqueError) {
        return {
          ...empty,
          error: "Slot ini baru saja dipesan oleh orang lain. Silakan pilih waktu lain.",
        };
      }
      throw dbError; // Re-throw unexpected errors
    }
  } catch {
    return {
      ...empty,
      error: "Terjadi kesalahan sistem. Silakan coba lagi.",
    };
  }
}
