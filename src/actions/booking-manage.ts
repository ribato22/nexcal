"use server";

/**
 * NexCal v2.5 — Patient Self-Service Portal Actions
 *
 * Token-based (no auth required). Patients access via `/booking/manage/[token]`.
 * Business Rules:
 * - Cancel/Reschedule only if >= 24h before startTime
 * - Max 1 reschedule per booking (rescheduleCount < 1)
 */

import { prisma } from "@/lib/prisma";
import { getAvailableSlots, ScheduleSession, DateOverrideData, ExistingBooking } from "@/lib/slots";
import { parse, startOfDay, addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";

// ============================================================
// Types
// ============================================================

export interface ManagedBooking {
  id: string;
  status: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  patientName: string;
  patientPhone: string;
  patientNotes: string | null;
  paymentStatus: string;
  totalPrice: number;
  dpAmount: number;
  cancelReason: string | null;
  meetingUrl: string | null;
  paymentUrl: string | null;
  rescheduleCount: number;
  managementToken: string;
  createdAt: Date;
  serviceType: {
    name: string;
    duration: number;
    color: string | null;
    isVirtual: boolean;
  };
  user: {
    name: string;
    clinicName: string | null;
    phone: string | null;
  };
}

// ============================================================
// getBookingByToken — Fetch booking for patient portal
// ============================================================

export async function getBookingByToken(token: string): Promise<ManagedBooking | null> {
  if (!token || token.length < 10) return null;

  const booking = await prisma.booking.findUnique({
    where: { managementToken: token },
    select: {
      id: true,
      status: true,
      date: true,
      startTime: true,
      endTime: true,
      patientName: true,
      patientPhone: true,
      patientNotes: true,
      paymentStatus: true,
      totalPrice: true,
      dpAmount: true,
      cancelReason: true,
      meetingUrl: true,
      paymentUrl: true,
      rescheduleCount: true,
      managementToken: true,
      createdAt: true,
      serviceType: {
        select: { name: true, duration: true, color: true, isVirtual: true },
      },
      user: {
        select: { name: true, clinicName: true, phone: true },
      },
    },
  });

  return booking as ManagedBooking | null;
}

// ============================================================
// canModifyBooking — Check 24h rule + status (private, used by server actions below)
// ============================================================

async function canModifyBooking(booking: ManagedBooking): Promise<{
  canCancel: boolean;
  canReschedule: boolean;
  reason?: string;
}> {
  const isActive = ["PENDING", "CONFIRMED"].includes(booking.status);
  if (!isActive) {
    return { canCancel: false, canReschedule: false, reason: "Booking sudah tidak aktif." };
  }
  const now = new Date();
  const hoursUntilStart = (new Date(booking.startTime).getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilStart < 24) {
    return {
      canCancel: false,
      canReschedule: false,
      reason: "Perubahan hanya bisa dilakukan minimal 24 jam sebelum jadwal.",
    };
  }
  const canReschedule = booking.rescheduleCount < 1;
  return {
    canCancel: true,
    canReschedule,
    reason: canReschedule ? undefined : "Batas perubahan jadwal telah habis. Silakan hubungi admin.",
  };
}

// ============================================================
// cancelBookingByPatient
// ============================================================

export async function cancelBookingByPatient(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const booking = await getBookingByToken(token);
  if (!booking) return { success: false, error: "Booking tidak ditemukan." };

  const { canCancel, reason } = await canModifyBooking(booking);
  if (!canCancel) return { success: false, error: reason };

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancelReason: "Dibatalkan oleh pasien melalui portal",
    },
  });

  revalidatePath(`/booking/manage/${token}`);
  return { success: true };
}

// ============================================================
// rescheduleBookingByPatient
// ============================================================

export async function rescheduleBookingByPatient(
  token: string,
  newDate: string,   // "YYYY-MM-DD"
  newTime: string    // "HH:mm"
): Promise<{ success: boolean; error?: string }> {
  const booking = await getBookingByToken(token);
  if (!booking) return { success: false, error: "Booking tidak ditemukan." };

  const { canReschedule, reason } = await canModifyBooking(booking);
  if (!canReschedule) return { success: false, error: reason };

  // Parse new datetime
  const refDate = startOfDay(parse(newDate, "yyyy-MM-dd", new Date()));
  const slotStart = parse(`${newDate} ${newTime}`, "yyyy-MM-dd HH:mm", new Date());
  const slotEnd = addMinutes(slotStart, booking.serviceType.duration);

  // Verify new slot is in the future (>= 24h from now)
  const now = new Date();
  if (slotStart.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
    return { success: false, error: "Jadwal baru harus minimal 24 jam dari sekarang." };
  }

  // Get the provider's userId from the booking
  const fullBooking = await prisma.booking.findUnique({
    where: { managementToken: token },
    select: { id: true, userId: true },
  });
  if (!fullBooking) return { success: false, error: "Booking tidak ditemukan." };

  const dayOfWeek = refDate.getDay();

  // Get schedules, overrides, and existing bookings for the new date
  const [userSchedules, dateOverrides, existingBookings] = await Promise.all([
    prisma.schedule.findMany({
      where: { userId: fullBooking.userId, dayOfWeek, isActive: true },
      select: { dayOfWeek: true, startTime: true, endTime: true },
    }),
    prisma.dateOverride.findMany({
      where: { userId: fullBooking.userId, date: refDate },
      select: { date: true, isBlocked: true, startTime: true, endTime: true },
    }),
    prisma.booking.findMany({
      where: {
        userId: fullBooking.userId,
        date: refDate,
        status: { in: ["PENDING", "CONFIRMED"] },
        id: { not: fullBooking.id }, // Exclude current booking from conflict check
      },
      select: { startTime: true, endTime: true },
    }),
  ]);

  // Check slot availability
  const sessions: ScheduleSession[] = userSchedules.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
  }));

  const overrides: DateOverrideData[] = dateOverrides.map((o) => ({
    date: o.date,
    isBlocked: o.isBlocked,
    startTime: o.startTime,
    endTime: o.endTime,
  }));

  const booked: ExistingBooking[] = existingBookings.map((b) => ({
    startTime: b.startTime,
    endTime: b.endTime,
  }));

  const slots = getAvailableSlots(refDate, sessions, overrides, booked, booking.serviceType.duration, 0);
  const isAvailable = slots.some((s) => s.startTime === newTime && s.available);

  if (!isAvailable) {
    return { success: false, error: "Slot yang dipilih tidak tersedia. Silakan pilih waktu lain." };
  }

  // Update booking with new datetime + increment rescheduleCount
  try {
    await prisma.booking.update({
      where: { id: fullBooking.id },
      data: {
        date: refDate,
        startTime: slotStart,
        endTime: slotEnd,
        rescheduleCount: { increment: 1 },
      },
    });
  } catch {
    return { success: false, error: "Slot ini baru saja dipesan oleh orang lain." };
  }

  revalidatePath(`/booking/manage/${token}`);
  return { success: true };
}
