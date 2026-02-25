"use server";

import { prisma } from "@/lib/prisma";
import { getAvailableSlots, type TimeSlot, type ScheduleSession, type DateOverrideData, type ExistingBooking } from "@/lib/slots";
import { startOfDay } from "date-fns";

/**
 * Mengambil slot yang tersedia untuk tanggal dan layanan tertentu.
 * Dipanggil dari halaman publik booking (tanpa auth).
 */
export async function getAvailableSlotsAction(
  dateStr: string,
  serviceTypeId: string
): Promise<{ slots: TimeSlot[]; error: string | null }> {
  try {
    const service = await prisma.serviceType.findUnique({
      where: { id: serviceTypeId },
      select: { duration: true, userId: true },
    });

    if (!service) {
      return { slots: [], error: "Layanan tidak ditemukan." };
    }

    const targetDate = new Date(dateStr);
    const userId = service.userId;

    const [schedules, overrides, bookings] = await Promise.all([
      prisma.schedule.findMany({
        where: { userId, isActive: true },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      }),
      prisma.dateOverride.findMany({
        where: { userId },
        select: { date: true, isBlocked: true, startTime: true, endTime: true },
      }),
      prisma.booking.findMany({
        where: {
          userId,
          date: startOfDay(targetDate),
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: { startTime: true, endTime: true },
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

    const existingBookings: ExistingBooking[] = bookings.map((b: { startTime: Date; endTime: Date }) => ({
      startTime: b.startTime,
      endTime: b.endTime,
    }));

    const slots = getAvailableSlots(
      targetDate,
      scheduleSessions,
      dateOverrides,
      existingBookings,
      service.duration
    );

    return { slots, error: null };
  } catch {
    return { slots: [], error: "Gagal memuat slot. Silakan coba lagi." };
  }
}

/**
 * Mengambil daftar layanan aktif (untuk halaman publik).
 */
export async function getActiveServices() {
  return prisma.serviceType.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      duration: true,
      description: true,
      color: true,
      userId: true,
    },
    orderBy: { name: "asc" },
  });
}
